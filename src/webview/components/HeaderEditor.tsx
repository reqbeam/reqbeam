import * as React from "react";

export interface HeaderRow {
  key: string;
  value: string;
  enabled?: boolean;
}

export interface HeaderEditorProps {
  headers: HeaderRow[];
  onChange: (headers: HeaderRow[]) => void;
}

export const HeaderEditor: React.FC<HeaderEditorProps> = ({
  headers,
  onChange,
}) => {
  const updateRow = (index: number, patch: Partial<HeaderRow>) => {
    const next = headers.map((h, i) => (i === index ? { ...h, ...patch } : h));
    ensureTrailingEmpty(next);
  };

  const ensureTrailingEmpty = (list: HeaderRow[]) => {
    const trimmed = list.filter((h, idx) => h.key || h.value || idx === list.length - 1);
    if (!trimmed[trimmed.length - 1] || (trimmed[trimmed.length - 1].key || trimmed[trimmed.length - 1].value)) {
      trimmed.push({ key: "", value: "", enabled: true });
    }
    onChange(trimmed);
  };

  const toggleEnabled = (index: number) => {
    updateRow(index, { enabled: headers[index].enabled === false ? true : false });
  };

  const removeRow = (index: number) => {
    const next = headers.filter((_, i) => i !== index);
    ensureTrailingEmpty(next);
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr>
          <th style={{ width: 30 }}></th>
          <th style={{ textAlign: "left" }}>Key</th>
          <th style={{ textAlign: "left" }}>Value</th>
          <th style={{ width: 30 }}></th>
        </tr>
      </thead>
      <tbody>
        {headers.map((h, index) => (
          <tr key={index}>
            <td>
              <input
                type="checkbox"
                checked={h.enabled !== false}
                onChange={() => toggleEnabled(index)}
              />
            </td>
            <td>
              <input
                style={{
                  width: "100%",
                  padding: "2px 4px",
                  fontSize: 12,
                  backgroundColor: "var(--vscode-input-background)",
                  color: "var(--vscode-input-foreground)",
                  border:
                    "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                  boxSizing: "border-box",
                }}
                value={h.key}
                onChange={(e) => updateRow(index, { key: e.target.value })}
              />
            </td>
            <td>
              <input
                style={{
                  width: "100%",
                  padding: "2px 4px",
                  fontSize: 12,
                  backgroundColor: "var(--vscode-input-background)",
                  color: "var(--vscode-input-foreground)",
                  border:
                    "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                  boxSizing: "border-box",
                }}
                value={h.value}
                onChange={(e) => updateRow(index, { value: e.target.value })}
              />
            </td>
            <td>
              {headers.length > 1 && (
                <button onClick={() => removeRow(index)}>×</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};


