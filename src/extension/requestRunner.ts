import * as http from "http";
import * as https from "https";
import * as vscode from "vscode";
import { URL } from "url";
import { SendRequestPayload, SendRequestResult, Workspace } from "../types/models";
import { Environment } from "../types/models";
import { EnvironmentManager } from "../core/environmentManager";
import { HistoryService } from "./historyService";
import { buildFinalUrl, applyAuth, mergeHeaders } from "../core/requestBuilder";
import { getParams } from "../storage/params";
import { getAuth } from "../storage/auth";
import { AuthManager } from "../auth/authManager";
import { resolveVariables, getMissingVariables } from "../core/envResolver";

export interface RequestRunnerDeps {
  historyService: HistoryService;
  getActiveEnvironment: () => Promise<Environment | null>;
  getActiveWorkspace: () => Promise<Workspace | null>;
  environmentManager: EnvironmentManager;
  authManager?: AuthManager;
}

export class RequestRunner {
  private readonly historyService: HistoryService;
  private readonly getActiveEnvironment: () => Promise<Environment | null>;
  private readonly getActiveWorkspace: () => Promise<Workspace | null>;
  private readonly environmentManager: EnvironmentManager;
  private readonly authManager?: AuthManager;

  constructor(deps: RequestRunnerDeps) {
    this.historyService = deps.historyService;
    this.getActiveEnvironment = deps.getActiveEnvironment;
    this.getActiveWorkspace = deps.getActiveWorkspace;
    this.environmentManager = deps.environmentManager;
    this.authManager = deps.authManager;
  }

  async sendRequest(payload: SendRequestPayload): Promise<SendRequestResult> {
    const activeEnv = await this.getActiveEnvironment();
    const envId = activeEnv ? String(activeEnv.id) : null;

    // Get environment variables
    let envVars: Record<string, string> = {};
    if (activeEnv && activeEnv.variables) {
      try {
        envVars = typeof activeEnv.variables === "string" 
          ? JSON.parse(activeEnv.variables) 
          : activeEnv.variables;
      } catch {
        envVars = {};
      }
    }

    // Collect all text that might contain variables
    const allTexts: string[] = [payload.url];
    if (payload.body) allTexts.push(payload.body);
    for (const h of payload.headers || []) {
      if (h.value) allTexts.push(h.value);
    }

    // Check for missing variables before sending
    const allMissingVars = new Set<string>();
    for (const text of allTexts) {
      const missing = getMissingVariables(text, envVars);
      missing.forEach(v => allMissingVars.add(v));
    }

    // If there are missing variables, show warning
    if (allMissingVars.size > 0) {
      const varList = Array.from(allMissingVars).join(", ");
      const result = await vscode.window.showWarningMessage(
        `Missing environment variables: ${varList}. Continue anyway?`,
        { modal: true },
        "Continue",
        "Cancel"
      );
      if (result !== "Continue") {
        throw new Error("Request cancelled due to missing environment variables");
      }
    }

    // Step 1: Resolve base URL with environment variables
    const resolvedUrl = resolveVariables(payload.url, envVars);

    // Step 2: Fetch and apply params (query parameters)
    // Note: Params values should also be resolved, but we'll do that in buildFinalUrl if needed
    let finalUrl = resolvedUrl;
    if (payload.id) {
      const params = await getParams(payload.id);
      // Resolve variables in param values
      const resolvedParams = params.map(p => ({
        ...p,
        value: resolveVariables(p.value, envVars),
      }));
      finalUrl = buildFinalUrl(resolvedUrl, resolvedParams);
    } else if (payload.params && payload.params.length > 0) {
      // Resolve variables in param values
      const resolvedParams = payload.params.map(p => ({
        ...p,
        value: resolveVariables(p.value, envVars),
      }));
      finalUrl = buildFinalUrl(resolvedUrl, resolvedParams);
    }

    // Step 3: Resolve body with environment variables
    const resolvedBody = resolveVariables(payload.body ?? "", envVars);

    // Step 4: Build custom headers (from user input)
    const customHeaders: Record<string, string> = {};
    for (const h of payload.headers || []) {
      if (h.enabled === false) continue;
      if (!h.key) continue;
      const originalValue = h.value ?? "";
      const resolvedValue = resolveVariables(originalValue, envVars);
      customHeaders[h.key] = resolvedValue;
    }

    // Step 5: Fetch and apply auth
    let authConfig = payload.authConfig || null;
    if (!authConfig && payload.id) {
      authConfig = await getAuth(payload.id);
    }

    const { headers: authHeaders, url: authUrl } = applyAuth(
      authConfig,
      {},
      finalUrl
    );

    // Step 6: Merge custom headers with auth headers
    let headers = mergeHeaders(customHeaders, authHeaders);
    finalUrl = authUrl;

    // Step 7: Inject authentication token if logged in (unless user has custom Authorization header)
    if (this.authManager) {
      const token = await this.authManager.getToken();
      if (token) {
        // Only add token if there's no Authorization header already set
        // (either from request auth config or custom headers)
        const hasAuthHeader = Object.keys(headers).some(
          (key) => key.toLowerCase() === "authorization"
        );
        if (!hasAuthHeader) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }


    const url = new URL(finalUrl);
    const isHttps = url.protocol === "https:";

    const options: http.RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? Number(url.port) : isHttps ? 443 : 80,
      method: payload.method,
      path: url.pathname + url.search,
      headers,
    };

    const client = isHttps ? https : http;

    const start = Date.now();

    const result: SendRequestResult = await new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on("data", (chunk) => {
          chunks.push(chunk as Buffer);
        });

        res.on("end", () => {
          const duration = Date.now() - start;
          const buffer = Buffer.concat(chunks);
          const body = buffer.toString("utf8");
          const size = buffer.length;

          let json: unknown;
          try {
            json = JSON.parse(body);
          } catch {
            json = undefined;
          }

          const headersObj: Record<string, string | string[]> = {};
          for (const [key, value] of Object.entries(res.headers)) {
            if (Array.isArray(value)) {
              headersObj[key] = value;
            } else if (typeof value === "string") {
              headersObj[key] = value;
            }
          }

          resolve({
            status: res.statusCode ?? 0,
            headers: headersObj,
            body,
            json,
            duration,
            size,
          });
        });
      });

      req.on("error", (err) => {
        reject(err);
      });

      if (resolvedBody && resolvedBody.length > 0) {
        req.write(resolvedBody);
      }

      req.end();
    });

    const activeWorkspace = await this.getActiveWorkspace();
    await this.historyService.addEntry({
      method: payload.method,
      url: finalUrl,
      status: result.status,
      duration: result.duration,
      createdAt: new Date().toISOString(),
      workspaceId: activeWorkspace?.id ?? payload.workspaceId ?? null,
    });

    return result;
  }
}


