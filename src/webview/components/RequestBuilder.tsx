import * as React from "react";
import { HttpMethod } from "../../types/models";
import { HeaderEditor, HeaderRow } from "./HeaderEditor";
import { BodyEditor } from "./BodyEditor";
import { Tabs } from "./Tabs";

export interface RequestBuilderProps {
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  body: string;
  requestName: string;
  environments: Array<{ id: number; name: string; variables: Record<string, string> }>;
  activeEnvId: number | null;
  onMethodChange: (m: HttpMethod) => void;
  onUrlChange: (u: string) => void;
  onHeadersChange: (h: HeaderRow[]) => void;
  onBodyChange: (b: string) => void;
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
  environments,
  activeEnvId,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onBodyChange,
  onRequestNameChange,
  onSend,
  onSave,
  onEnvironmentChange,
  statusText,
  vscode,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>("headers");
  
  const activeEnv = React.useMemo(() => {
    return environments.find((e) => e.id === activeEnvId) || null;
  }, [environments, activeEnvId]);

  const resolveVariable = React.useCallback((text: string): string => {
    if (!activeEnv || !text) return text;
    return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key) => {
      return activeEnv.variables[key] ?? `{{${key}}}`;
    });
  }, [activeEnv]);

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
          <input
            style={{
              width: "100%",
              padding: "2px 6px",
              fontSize: 12,
              backgroundColor: "var(--vscode-input-background)",
              color: "var(--vscode-input-foreground)",
              border:
                "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
              borderRadius: 2,
            }}
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://api.example.com/path or {{baseUrl}}/path"
          />
          {activeEnv && url && url.includes("{{") && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 2,
                padding: "4px 6px",
                fontSize: 10,
                backgroundColor: "var(--vscode-editor-background)",
                border: "1px solid var(--vscode-editorGroup-border)",
                borderRadius: 2,
                zIndex: 10,
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              Resolved: {resolveVariable(url)}
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
            { id: "headers", label: "Headers" },
            { id: "body", label: "Body" },
          ]}
          activeId={activeTab}
          onChange={setActiveTab}
        />
        <div
          style={{ flex: 1, minHeight: 0, overflow: "auto", paddingTop: 6 }}
        >
          {activeTab === "headers" && (
            <div>
              <HeaderEditor headers={headers} onChange={onHeadersChange} />
            </div>
          )}
          {activeTab === "body" && (
            <div>
              <BodyEditor body={body} onChange={onBodyChange} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

