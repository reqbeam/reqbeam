import * as React from "react";

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
}

export interface EnvironmentEditorProps {
  vscode: { postMessage: (msg: unknown) => void };
  environmentId: string;
  environmentName: string;
  variables: EnvironmentVariable[];
}

export const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({
  vscode,
  environmentId,
  environmentName,
  variables: initialVariables,
}) => {
  const [variables, setVariables] = React.useState<EnvironmentVariable[]>(
    initialVariables.length > 0
      ? initialVariables
      : [{ id: "new-0", key: "", value: "" }]
  );
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setVariables(
      initialVariables.length > 0
        ? initialVariables
        : [{ id: "new-0", key: "", value: "" }]
    );
    setHasChanges(false);
    // Clear any pending saves when environment changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [environmentId, initialVariables]);

  const saveVariables = React.useCallback(() => {
    const varsMap: Record<string, string> = {};
    for (const v of variables) {
      if (v.key.trim()) {
        varsMap[v.key.trim()] = v.value;
      }
    }

    setIsSaving(true);
    vscode.postMessage({
      type: "saveEnvironmentVariables",
      payload: {
        environmentId,
        variables: varsMap,
      },
    });
    setHasChanges(false);
    // Reset saving state after a short delay
    setTimeout(() => setIsSaving(false), 500);
  }, [variables, environmentId, vscode]);

  // Auto-save with debounce (500ms delay)
  React.useEffect(() => {
    if (hasChanges && environmentId) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveVariables();
      }, 500);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasChanges, environmentId, saveVariables]);

  const handleVariableChange = (
    id: string,
    field: "key" | "value",
    value: string
  ) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
    setHasChanges(true);
  };

  const handleAddRow = () => {
    const newId = `new-${Date.now()}`;
    setVariables((prev) => [...prev, { id: newId, key: "", value: "" }]);
    setHasChanges(true);
  };

  const handleDeleteRow = (id: string) => {
    setVariables((prev) => {
      const filtered = prev.filter((v) => v.id !== id);
      return filtered.length === 0
        ? [{ id: "new-0", key: "", value: "" }]
        : filtered;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // Clear auto-save timeout and save immediately
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    saveVariables();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--vscode-panel-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--vscode-editor-foreground)",
            }}
          >
            {environmentName}
          </h2>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "12px",
              color: "var(--vscode-descriptionForeground)",
            }}
          >
            Environment Variables
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isSaving && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              Saving...
            </span>
          )}
          {hasChanges && !isSaving && (
            <span
              style={{
                fontSize: "11px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{
              padding: "6px 16px",
              backgroundColor: hasChanges && !isSaving
                ? "var(--vscode-button-background)"
                : "var(--vscode-button-secondaryBackground)",
              color: hasChanges && !isSaving
                ? "var(--vscode-button-foreground)"
                : "var(--vscode-button-secondaryForeground)",
              border: "none",
              borderRadius: "2px",
              cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--vscode-panel-border)",
              }}
            >
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontWeight: 600,
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                Key
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  fontWeight: 600,
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                Value
              </th>
              <th
                style={{
                  width: "60px",
                  padding: "8px 12px",
                }}
              ></th>
            </tr>
          </thead>
          <tbody>
            {variables.map((variable) => (
              <tr
                key={variable.id}
                style={{
                  borderBottom: "1px solid var(--vscode-panel-border)",
                }}
              >
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={variable.key}
                    onChange={(e) =>
                      handleVariableChange(variable.id, "key", e.target.value)
                    }
                    placeholder="Variable name"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      backgroundColor: "var(--vscode-input-background)",
                      color: "var(--vscode-input-foreground)",
                      border: "1px solid var(--vscode-input-border)",
                      borderRadius: "2px",
                      fontSize: "13px",
                      fontFamily: "var(--vscode-font-family)",
                    }}
                  />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <input
                    type="text"
                    value={variable.value}
                    onChange={(e) =>
                      handleVariableChange(variable.id, "value", e.target.value)
                    }
                    placeholder="Variable value"
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      backgroundColor: "var(--vscode-input-background)",
                      color: "var(--vscode-input-foreground)",
                      border: "1px solid var(--vscode-input-border)",
                      borderRadius: "2px",
                      fontSize: "13px",
                      fontFamily: "var(--vscode-font-family)",
                    }}
                  />
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleDeleteRow(variable.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "transparent",
                      color: "var(--vscode-errorForeground)",
                      border: "1px solid var(--vscode-input-border)",
                      borderRadius: "2px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--vscode-panel-border)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={handleAddRow}
          style={{
            padding: "6px 16px",
            backgroundColor: "var(--vscode-button-secondaryBackground)",
            color: "var(--vscode-button-secondaryForeground)",
            border: "none",
            borderRadius: "2px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          + Add Row
        </button>
      </div>
    </div>
  );
};

