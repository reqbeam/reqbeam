import * as React from "react";
import { SendRequestResult } from "../../types/models";
import { Tabs } from "./Tabs";
import { formatJson, humanFileSize } from "../../utils/formatter";

export interface ResponseViewerProps {
  response: SendRequestResult | null;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response }) => {
  const [activeTab, setActiveTab] = React.useState<string>("body");

  if (!response) {
    return (
      <div style={{ padding: 8, fontSize: 12 }}>No response yet. Send a request.</div>
    );
  }

  const prettyBody =
    typeof response.json !== "undefined"
      ? JSON.stringify(response.json, null, 2)
      : formatJson(response.body);

  const headersText = Object.entries(response.headers)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  const rawText = [
    `Status: ${response.status}`,
    `Duration: ${response.duration}ms`,
    `Size: ${humanFileSize(response.size)}`,
    "",
    headersText,
    "",
    response.body,
  ].join("\n");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "4px 8px",
          borderBottom: "1px solid var(--vscode-editorGroup-border)",
          fontSize: 12,
        }}
      >
        <div>
          <strong>{response.status}</strong> • {response.duration}ms •{" "}
          {humanFileSize(response.size)}
        </div>
      </div>
      <Tabs
        tabs={[
          { id: "body", label: "Body" },
          { id: "headers", label: "Headers" },
          { id: "raw", label: "Raw" },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />
      <div style={{ flex: 1, padding: 8 }}>
        {activeTab === "body" && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {prettyBody}
          </pre>
        )}
        {activeTab === "headers" && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {headersText}
          </pre>
        )}
        {activeTab === "raw" && (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            {rawText}
          </pre>
        )}
      </div>
    </div>
  );
};


