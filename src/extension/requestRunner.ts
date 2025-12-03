import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { SendRequestPayload, SendRequestResult, Workspace } from "../types/models";
import { Environment } from "../types/models";
import { parseEnvironment, resolveVariables } from "../utils/variableResolver";
import { HistoryService } from "./historyService";

export interface RequestRunnerDeps {
  historyService: HistoryService;
  getActiveEnvironment: () => Promise<Environment | null>;
  getActiveWorkspace: () => Promise<Workspace | null>;
}

export class RequestRunner {
  private readonly historyService: HistoryService;
  private readonly getActiveEnvironment: () => Promise<Environment | null>;
  private readonly getActiveWorkspace: () => Promise<Workspace | null>;

  constructor(deps: RequestRunnerDeps) {
    this.historyService = deps.historyService;
    this.getActiveEnvironment = deps.getActiveEnvironment;
    this.getActiveWorkspace = deps.getActiveWorkspace;
  }

  async sendRequest(payload: SendRequestPayload): Promise<SendRequestResult> {
    const activeEnv = await this.getActiveEnvironment();
    const vars = parseEnvironment(activeEnv);

    const resolvedUrl = resolveVariables(payload.url, vars);
    const resolvedBody = resolveVariables(payload.body ?? "", vars);

    const headers: Record<string, string> = {};
    for (const h of payload.headers || []) {
      if (h.enabled === false) continue;
      if (!h.key) continue;
      headers[h.key] = resolveVariables(h.value ?? "", vars);
    }

    const url = new URL(resolvedUrl);
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
      url: resolvedUrl,
      status: result.status,
      duration: result.duration,
      createdAt: new Date().toISOString(),
      workspaceId: activeWorkspace?.id ?? payload.workspaceId ?? null,
    });

    return result;
  }
}


