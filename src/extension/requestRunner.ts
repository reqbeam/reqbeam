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

    // Track unresolved variables for warnings
    const unresolvedVars = new Set<string>();

    const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    
    // Check original text for variables, then check resolved text for any that remain unresolved
    const checkUnresolved = (originalText: string, resolvedText: string): void => {
      // Find all variables in the original text
      const originalMatches = originalText.matchAll(VARIABLE_REGEX);
      for (const match of originalMatches) {
        const varName = match[1];
        // Check if this variable still exists in the resolved text (meaning it wasn't resolved)
        if (resolvedText.includes(`{{${varName}}}`) || resolvedText.includes(`{{ ${varName} }}`)) {
          unresolvedVars.add(varName);
        }
      }
    };

    // Step 1: Resolve base URL with environment variables
    let resolvedUrl = await this.environmentManager.resolveVariables(
      payload.url,
      envId
    );
    checkUnresolved(payload.url, resolvedUrl);

    // Step 2: Fetch and apply params (query parameters)
    let finalUrl = resolvedUrl;
    if (payload.id) {
      const params = await getParams(payload.id);
      finalUrl = buildFinalUrl(resolvedUrl, params);
    } else if (payload.params && payload.params.length > 0) {
      finalUrl = buildFinalUrl(resolvedUrl, payload.params);
    }

    // Step 3: Resolve body with environment variables
    const resolvedBody = await this.environmentManager.resolveVariables(
      payload.body ?? "",
      envId
    );
    checkUnresolved(payload.body ?? "", resolvedBody);

    // Step 4: Build custom headers (from user input)
    const customHeaders: Record<string, string> = {};
    for (const h of payload.headers || []) {
      if (h.enabled === false) continue;
      if (!h.key) continue;
      const originalValue = h.value ?? "";
      const resolvedValue = await this.environmentManager.resolveVariables(
        originalValue,
        envId
      );
      checkUnresolved(originalValue, resolvedValue);
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

    // Log warnings for unresolved variables
    if (unresolvedVars.size > 0 && envId) {
      const outputChannel = vscode.window.createOutputChannel("ReqBeam");
      outputChannel.appendLine(
        `⚠️ Warning: Unresolved variables found: ${Array.from(unresolvedVars).join(", ")}`
      );
      outputChannel.appendLine(
        `Environment "${activeEnv?.name || envId}" does not contain these variables.`
      );
      outputChannel.appendLine(
        `Variables will be sent as-is (e.g., {{variableName}}).`
      );
      outputChannel.show(true);
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


