import * as React from "react";
import { HttpMethod } from "../../types/models";
import { HeaderEditor, HeaderRow } from "./HeaderEditor";
import { BodyEditor } from "./BodyEditor";

export interface RequestBuilderProps {
  method: HttpMethod;
  url: string;
  headers: HeaderRow[];
  body: string;
  requestName: string;
  onMethodChange: (m: HttpMethod) => void;
  onUrlChange: (u: string) => void;
  onHeadersChange: (h: HeaderRow[]) => void;
  onBodyChange: (b: string) => void;
  onRequestNameChange: (name: string) => void;
  onSend: () => void;
  onSave: () => void;
  statusText: string;
}

export const RequestBuilder: React.FC<RequestBuilderProps> = ({
  method,
  url,
  headers,
  body,
  requestName,
  onMethodChange,
  onUrlChange,
  onHeadersChange,
  onBodyChange,
  onRequestNameChange,
  onSend,
  onSave,
  statusText,
}) => {
  return (
    <div
      style={{
        padding: 8,
        borderBottom: "1px solid var(--vscode-editorGroup-border)",
      }}
    >
      <div style={{ display: "flex", marginBottom: 6, gap: 4 }}>
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map(
            (m) => (
              <option key={m} value={m}>
                {m}
              </option>
            )
          )}
        </select>
        <input
          style={{ flex: 1 }}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://api.example.com/path"
        />
        <button onClick={onSend}>Send</button>
        <button onClick={onSave}>Save</button>
      </div>
      <div style={{ display: "flex", marginBottom: 6, gap: 4 }}>
        <input
          style={{ flex: 1 }}
          value={requestName}
          onChange={(e) => onRequestNameChange(e.target.value)}
          placeholder="Request name (for saved request)"
        />
      </div>
      {statusText && (
        <div style={{ fontSize: 11, marginBottom: 4 }}>{statusText}</div>
      )}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Headers</div>
        <HeaderEditor headers={headers} onChange={onHeadersChange} />
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Body</div>
        <BodyEditor body={body} onChange={onBodyChange} />
      </div>
    </div>
  );
};

