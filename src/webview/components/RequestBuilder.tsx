import * as React from "react";
import { HttpMethod, RequestParam, RequestAuth } from "../../types/models";
import { HeaderEditor, HeaderRow } from "./HeaderEditor";
import { BodyEditor } from "./BodyEditor";
import { ParamsSection } from "./ParamsSection";
import { AuthSection } from "./AuthSection";
import { Tabs } from "./Tabs";
import { buildFinalUrl } from "../utils/urlBuilder";
import { resolveVariables } from "../../core/envResolver";
import { VariableHighlightInput } from "./VariableHighlightInput";

export interface RequestBuilderProps {
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  body: string;
  requestName: string;
  params: RequestParam[];
  auth: RequestAuth | null;
  environments: Array<{ id: number; name: string; variables: Record<string, string> }>;
  activeEnvId: number | null;
  onMethodChange: (m: HttpMethod) => void;
  onUrlChange: (u: string) => void;
  onHeadersChange: (h: HeaderRow[]) => void;
  onBodyChange: (b: string) => void;
  onParamsChange: (p: RequestParam[]) => void;
  onAuthChange: (a: RequestAuth | null) => void;
  onRequestNameChange: (name: string) => void;
  onSend: () => void;
  onSave: () => void;
  onEnvironmentChange: (envId: number | null) => void;
  statusText: string;
  vscode: { postMessage: (msg: unknown) => void };
}

const getMethodColor = (method: HttpMethod): string => {
  switch (method) {
    case "GET":
      return "#3fb950"; // green
    case "POST":
      return "#2f81f7"; // blue
    case "PUT":
      return "#a371f7"; // purple
    case "PATCH":
      return "#d29922"; // yellow
    case "DELETE":
      return "#f85149"; // red
    default:
      return "#8b949e"; // gray
  }
};

export const RequestBuilder: React.FC<RequestBuilderProps> = ({
  method,
  url,
  headers,
  body,
  requestName,
  params,
  auth,
  environments,
  activeEnvId,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onBodyChange,
  onParamsChange,
  onAuthChange,
  onRequestNameChange,
  onSend,
  onSave,
  onEnvironmentChange,
  statusText,
  vscode,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>("headers");
  
  const activeEnv = React.useMemo(() => {
    console.log("RequestBuilder - Finding active env. activeEnvId:", activeEnvId, "type:", typeof activeEnvId, "environments:", environments);
    // Try to find by id first, then by isActive flag
    let found = environments.find((e) => {
      // Handle both string and number comparison
      const match = e.id === activeEnvId || String(e.id) === String(activeEnvId) || Number(e.id) === Number(activeEnvId);
      console.log("RequestBuilder - Comparing env.id:", e.id, "type:", typeof e.id, "with activeEnvId:", activeEnvId, "type:", typeof activeEnvId, "match:", match, "isActive:", e.isActive);
      return match;
    });
    
    // Fallback: find by isActive flag if no match by id
    if (!found) {
      found = environments.find((e) => e.isActive);
      console.log("RequestBuilder - Fallback: Found by isActive flag:", found);
    }
    
    console.log("RequestBuilder - Final found active env:", found);
    if (found) {
      console.log("RequestBuilder - Active env variables:", found.variables, "keys:", Object.keys(found.variables || {}));
    }
    return found || null;
  }, [environments, activeEnvId]);

  const envVars = React.useMemo(() => {
    console.log("RequestBuilder - activeEnv:", activeEnv);
    if (!activeEnv) {
      console.log("RequestBuilder - No active environment");
      return {};
    }
    
    if (!activeEnv.variables) {
      console.log("RequestBuilder - No variables in activeEnv");
      return {};
    }
    
    // Handle both string (JSON) and object formats
    let vars: Record<string, string> = {};
    if (typeof activeEnv.variables === "string") {
      try {
        vars = JSON.parse(activeEnv.variables);
        console.log("RequestBuilder - Parsed from string:", Object.keys(vars).length, vars);
      } catch (e) {
        console.error("RequestBuilder - Failed to parse environment variables:", e);
        vars = {};
      }
    } else if (typeof activeEnv.variables === "object") {
      vars = activeEnv.variables;
      console.log("RequestBuilder - Using object directly:", Object.keys(vars).length, vars);
    } else {
      console.log("RequestBuilder - Unknown variables type:", typeof activeEnv.variables);
    }
    
    console.log("RequestBuilder - Final envVars:", Object.keys(vars).length, "variables", vars);
    return vars;
  }, [activeEnv]);

  // Calculate final URL with params
  const resolvedUrl = React.useMemo(() => {
    if (!url) return "";
    try {
      // Resolve environment variables first
      const resolved = resolveVariables(url, envVars);
      // Then apply params
      return buildFinalUrl(resolved, params);
    } catch {
      return url;
    }
  }, [url, params, envVars]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        padding: 8,
      }}
    >
      {/* Environment Switcher - Postman style */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
          paddingBottom: 6,
          borderBottom: "1px solid var(--vscode-editorGroup-border)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--vscode-descriptionForeground)" }}>
          Environment:
        </div>
        <select
          value={activeEnvId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            onEnvironmentChange(value ? Number(value) : null);
          }}
          style={{
            flex: 1,
            maxWidth: 200,
            padding: "2px 6px",
            fontSize: 12,
            backgroundColor: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            border:
              "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
            borderRadius: 2,
          }}
        >
          <option value="">No Environment</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
        {activeEnv && (
          <div
            style={{
              fontSize: 10,
              padding: "2px 6px",
              backgroundColor: "var(--vscode-badge-background)",
              color: "var(--vscode-badge-foreground)",
              borderRadius: 2,
            }}
          >
            {Object.keys(activeEnv.variables).length} variables
          </div>
        )}
        <button
          onClick={() => {
            vscode.postMessage({ type: "createEnvironment" });
          }}
          style={{
            padding: "2px 6px",
            fontSize: 11,
            backgroundColor: "transparent",
            color: "var(--vscode-textLink-foreground)",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          title="Create new environment"
        >
          + New
        </button>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          style={{
            padding: "2px 6px",
            fontSize: 12,
            backgroundColor: "var(--vscode-input-background)",
            color: getMethodColor(method),
            border:
              "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
            borderRadius: 2,
          }}
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            )
          )}
        </select>
        <div style={{ flex: 1, position: "relative" }}>
          <VariableHighlightInput
            value={url}
            onChange={onUrlChange}
            placeholder="https://api.example.com/path or {{baseUrl}}/path"
            environmentVariables={envVars}
            style={{
              padding: "2px 6px",
              borderRadius: 2,
            }}
          />
          {activeEnv && url && url.includes("{{") && (
            <div
              style={{
                position: "relative",
                marginTop: 2,
                padding: "4px 6px",
                fontSize: 10,
                backgroundColor: "var(--vscode-editor-background)",
                border: "1px solid var(--vscode-editorGroup-border)",
                borderRadius: 2,
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              Resolved: {resolveVariables(url, envVars)}
            </div>
          )}
        </div>
        <button
          onClick={onSend}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            backgroundColor: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
            border: "none",
            borderRadius: 2,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
        <button
          onClick={onSave}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            backgroundColor: "transparent",
            color: "var(--vscode-editor-foreground)",
            border: "1px solid var(--vscode-editorGroup-border)",
            borderRadius: 2,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Save
        </button>
      </div>
      {statusText && (
        <div style={{ fontSize: 11, marginBottom: 4 }}>{statusText}</div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          borderTop: "1px solid var(--vscode-editorGroup-border)",
        }}
      >
        <Tabs
          tabs={[
            { id: "params", label: "Params" },
            { id: "headers", label: "Headers" },
            { id: "body", label: "Body" },
            { id: "auth", label: "Authorization" },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
        <div
          style={{ flex: 1, minHeight: 0, overflow: "auto", paddingTop: 6 }}
        >
          {activeTab === "params" && (
            <div style={{ height: "100%", padding: "0 8px" }}>
              <ParamsSection
                params={params}
                finalUrl={resolvedUrl}
                onChange={onParamsChange}
                vscode={vscode}
                environmentVariables={envVars}
              />
            </div>
          )}
          {activeTab === "headers" && (
            <div>
              <HeaderEditor 
                headers={headers} 
                onChange={onHeadersChange}
                environmentVariables={envVars}
              />
            </div>
          )}
          {activeTab === "body" && (
            <div>
              <BodyEditor 
                body={body} 
                onChange={onBodyChange}
                environmentVariables={envVars}
              />
            </div>
          )}
          {activeTab === "auth" && (
            <div style={{ height: "100%", padding: "0 8px" }}>
              <AuthSection
                auth={auth}
                onChange={onAuthChange}
                vscode={vscode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

