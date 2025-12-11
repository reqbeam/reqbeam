import * as React from "react";
import { RequestParam } from "../../types/models";

export interface ParamsSectionProps {
  params: RequestParam[];
  finalUrl: string;
  onChange: (params: RequestParam[]) => void;
  vscode: { postMessage: (msg: unknown) => void };
}

export const ParamsSection: React.FC<ParamsSectionProps> = ({
  params,
  finalUrl,
  onChange,
  vscode,
}) => {
  const handleAdd = () => {
    const newParam: RequestParam = {
      id: Date.now(), // Temporary ID
      requestId: 0,
      key: "",
      value: "",
      active: true,
    };
    onChange([...params, newParam]);
  };

  const handleRemove = (id: number) => {
    onChange(params.filter((p) => p.id !== id));
  };

  const handleChange = (
    id: number,
    field: "key" | "value" | "active",
    value: string | boolean
  ) => {
    onChange(
      params.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  // Check for duplicate active keys
  const activeKeys = params.filter((p) => p.active).map((p) => p.key.toLowerCase());
  const hasDuplicates = activeKeys.length !== new Set(activeKeys).size;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Final URL Preview */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-editorGroup-border)",
          borderRadius: 4,
          marginBottom: 8,
          fontSize: 11,
        }}
      >
        <div
          style={{
            color: "var(--vscode-descriptionForeground)",
            marginBottom: 4,
            fontSize: 10,
          }}
        >
          Final URL:
        </div>
        <div
          style={{
            color: "var(--vscode-textLink-foreground)",
            wordBreak: "break-all",
            fontFamily: "monospace",
          }}
        >
          {finalUrl || "No URL"}
        </div>
      </div>

      {/* Duplicate Warning */}
      {hasDuplicates && (
        <div
          style={{
            padding: "6px 12px",
            backgroundColor: "var(--vscode-inputValidation-warningBackground)",
            border: "1px solid var(--vscode-inputValidation-warningBorder)",
            borderRadius: 4,
            marginBottom: 8,
            fontSize: 11,
            color: "var(--vscode-inputValidation-warningForeground)",
          }}
        >
          ⚠️ Warning: Duplicate active parameter keys detected
        </div>
      )}

      {/* Params Table */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          border: "1px solid var(--vscode-editorGroup-border)",
          borderRadius: 4,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "var(--vscode-editor-background)",
                borderBottom: "1px solid var(--vscode-editorGroup-border)",
              }}
            >
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "left",
                  fontWeight: 600,
                  width: 40,
                }}
              >
                ✓
              </th>
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "left",
                  fontWeight: 600,
                  width: "40%",
                }}
              >
                Key
              </th>
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "left",
                  fontWeight: 600,
                }}
              >
                Value
              </th>
              <th
                style={{
                  padding: "6px 8px",
                  textAlign: "center",
                  fontWeight: 600,
                  width: 60,
                }}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {params.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--vscode-descriptionForeground)",
                  }}
                >
                  No parameters. Click "Add Param" to add one.
                </td>
              </tr>
            ) : (
              params.map((param) => (
                <tr
                  key={param.id}
                  style={{
                    borderBottom: "1px solid var(--vscode-editorGroup-border)",
                  }}
                >
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={param.active}
                      onChange={(e) =>
                        handleChange(param.id, "active", e.target.checked)
                      }
                      style={{
                        cursor: "pointer",
                      }}
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) =>
                        handleChange(param.id, "key", e.target.value)
                      }
                      placeholder="Parameter key"
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
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) =>
                        handleChange(param.id, "value", e.target.value)
                      }
                      placeholder="Parameter value"
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
                    />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "center" }}>
                    <button
                      onClick={() => handleRemove(param.id)}
                      style={{
                        padding: "2px 6px",
                        fontSize: 11,
                        backgroundColor: "transparent",
                        color: "var(--vscode-errorForeground)",
                        border: "none",
                        cursor: "pointer",
                      }}
                      title="Remove parameter"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Button */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleAdd}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            backgroundColor: "var(--vscode-button-secondaryBackground)",
            color: "var(--vscode-button-secondaryForeground)",
            border: "none",
            borderRadius: 2,
            cursor: "pointer",
          }}
        >
          + Add Param
        </button>
      </div>
    </div>
  );
};


