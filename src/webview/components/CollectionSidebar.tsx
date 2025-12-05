import * as React from "react";
import { Workspace } from "../../types/models";

interface Request {
  id: number;
  name: string;
  method: string;
  url: string;
}

interface Collection {
  id: number;
  name: string;
  requests?: Request[];
}

interface HistoryItem {
  id: number;
  method: string;
  url: string;
  status: number;
  duration: number;
  createdAt: string;
}

interface Environment {
  id: number;
  name: string;
  variables: Record<string, string>;
}

export interface CollectionSidebarProps {
  vscode: { postMessage: (msg: unknown) => void };
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({
  vscode,
}) => {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<number | null>(
    null
  );
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [environments, setEnvironments] = React.useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = React.useState<number | null>(null);
  const [envVars, setEnvVars] = React.useState<Record<string, string>>({});
  const [expandedCollections, setExpandedCollections] = React.useState<Set<number>>(new Set());

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      switch (msg.type) {
        case "collections": {
          const payload = msg.payload as
            | Collection[]
            | {
                collections?: Collection[];
                workspaces?: Workspace[];
                activeWorkspaceId?: number | null;
              };
          if (Array.isArray(payload)) {
            setCollections(payload);
            setWorkspaces([]);
            setActiveWorkspaceId(null);
          } else if (payload) {
            if (Array.isArray(payload.collections)) {
              setCollections(payload.collections);
            } else {
              setCollections([]);
            }
            if (Array.isArray(payload.workspaces)) {
              setWorkspaces(payload.workspaces);
            }
            if (
              typeof payload.activeWorkspaceId === "number" ||
              payload.activeWorkspaceId === null
            ) {
              setActiveWorkspaceId(payload.activeWorkspaceId);
            }
          } else {
            setCollections([]);
            setWorkspaces([]);
            setActiveWorkspaceId(null);
          }
          break;
        }
        case "history":
          setHistory(msg.payload as HistoryItem[]);
          break;
        case "environments": {
          const payload = msg.payload as {
            environments: Environment[];
            activeId: number | null;
          };
          setEnvironments(payload.environments);
          setActiveEnvId(payload.activeId);
          if (payload.activeId != null) {
            const active = payload.environments.find(
              (e) => e.id === payload.activeId
            );
            setEnvVars(active?.variables ?? {});
          } else {
            setEnvVars({});
          }
          break;
        }
        default:
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const onSelectHistory = (item: HistoryItem) => {
    vscode.postMessage({ type: "loadHistory", payload: item });
  };

  const onToggleCollection = (collectionId: number) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const onLoadRequest = async (request: Request) => {
    // Request full request data from extension
    vscode.postMessage({
      type: "loadRequest",
      payload: { id: request.id },
    });
  };

  const onSetEnvironment = (id: number | null) => {
    vscode.postMessage({ type: "setEnvironment", payload: id });
    const env = environments.find((e) => e.id === id);
    setEnvVars(env?.variables ?? {});
  };

  const onSetWorkspace = (id: number | null) => {
    setActiveWorkspaceId(id);
    vscode.postMessage({ type: "setWorkspace", payload: id });
  };

  const onCreateWorkspace = () => {
    vscode.postMessage({ type: "createWorkspace" });
  };

  const onCreateEnvironment = () => {
    vscode.postMessage({ type: "createEnvironment" });
  };

  const upsertEnvVar = (key: string, value: string, originalKey?: string) => {
    setEnvVars((prev) => {
      const next = { ...prev };
      const targetKey = originalKey && originalKey !== key ? originalKey : key;
      if (targetKey && targetKey in next && targetKey !== key) {
        delete next[targetKey];
      }
      if (!key && !value) {
        if (key in next) {
          delete next[key];
        }
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const persistEnvVars = () => {
    if (activeEnvId == null) return;
    vscode.postMessage({
      type: "updateEnvironmentVariables",
      payload: { id: activeEnvId, variables: envVars },
    });
  };

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid var(--vscode-editorGroup-border)",
        display: "flex",
        flexDirection: "column",
        fontSize: 12,
      }}
    >
      {/* Workspaces */}
      <div
        style={{
          padding: "4px 8px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span>Workspaces</span>
        <button
          onClick={onCreateWorkspace}
          style={{
            fontSize: 11,
            padding: "2px 6px",
            cursor: "pointer",
          }}
        >
          + New
        </button>
      </div>
      <div style={{ maxHeight: 120, overflow: "auto" }}>
        <div
          style={{
            padding: "2px 8px",
            cursor: "pointer",
            background:
              activeWorkspaceId == null
                ? "var(--vscode-list-activeSelectionBackground)"
                : "transparent",
          }}
          onClick={() => onSetWorkspace(null)}
        >
          All Workspaces
        </div>
        {workspaces.map((w) => (
          <div
            key={w.id}
            style={{
              padding: "2px 8px",
              cursor: "pointer",
              background:
                activeWorkspaceId === w.id
                  ? "var(--vscode-list-activeSelectionBackground)"
                  : "transparent",
            }}
            onClick={() => onSetWorkspace(w.id)}
          >
            {w.name}
          </div>
        ))}
      </div>

      {/* Environments */}
      <div
        style={{
          padding: "4px 8px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span>Environments</span>
        <button
          onClick={onCreateEnvironment}
          style={{
            fontSize: 11,
            padding: "2px 6px",
            cursor: "pointer",
          }}
        >
          + New
        </button>
      </div>
      <div style={{ maxHeight: 120, overflow: "auto" }}>
        <div
          style={{
            padding: "2px 8px",
            cursor: "pointer",
            background:
              activeEnvId == null
                ? "var(--vscode-list-activeSelectionBackground)"
                : "transparent",
          }}
          onClick={() => onSetEnvironment(null)}
        >
          None
        </div>
        {environments.map((env) => (
          <div
            key={env.id}
            style={{
              padding: "2px 8px",
              cursor: "pointer",
              background:
                activeEnvId === env.id
                  ? "var(--vscode-list-activeSelectionBackground)"
                  : "transparent",
            }}
            onClick={() => onSetEnvironment(env.id)}
          >
            {env.name}
          </div>
        ))}
      </div>
      {activeEnvId != null && (
        <div
          style={{
            padding: "4px 8px 8px",
            borderTop: "1px solid var(--vscode-editorGroup-border)",
            borderBottom: "1px solid var(--vscode-editorGroup-border)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11 }}>
            Environment Variables
          </div>
          <div
            style={{
              maxHeight: 140,
              overflow: "auto",
              border: "1px solid var(--vscode-editorGroup-border)",
              borderRadius: 2,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "2px 4px",
                      borderBottom:
                        "1px solid var(--vscode-editorGroup-border)",
                    }}
                  >
                    Key
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "2px 4px",
                      borderBottom:
                        "1px solid var(--vscode-editorGroup-border)",
                    }}
                  >
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Object.entries(envVars), ["", ""]].map(
                  ([k, v], index) => (
                    <tr key={index}>
                      <td style={{ padding: "2px 4px" }}>
                        <input
                          style={{
                            width: "100%",
                            padding: "2px 4px",
                            fontSize: 11,
                            backgroundColor:
                              "var(--vscode-input-background)",
                            color: "var(--vscode-input-foreground)",
                            border:
                              "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                            boxSizing: "border-box",
                          }}
                          value={k}
                          onChange={(e) =>
                            upsertEnvVar(e.target.value, v as string, k)
                          }
                          onBlur={persistEnvVars}
                        />
                      </td>
                      <td style={{ padding: "2px 4px" }}>
                        <input
                          style={{
                            width: "100%",
                            padding: "2px 4px",
                            fontSize: 11,
                            backgroundColor:
                              "var(--vscode-input-background)",
                            color: "var(--vscode-input-foreground)",
                            border:
                              "1px solid var(--vscode-input-border, var(--vscode-editorGroup-border))",
                            boxSizing: "border-box",
                          }}
                          value={v as string}
                          onChange={(e) =>
                            upsertEnvVar(k, e.target.value, k)
                          }
                          onBlur={persistEnvVars}
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collections */}
      <div style={{ padding: "4px 8px", fontWeight: 600 }}>Collections</div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {collections.map((c) => {
          const isExpanded = expandedCollections.has(c.id);
          const requests = c.requests || [];
          return (
            <div key={c.id}>
              <div
                style={{
                  padding: "2px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
                onClick={() => onToggleCollection(c.id)}
              >
                <span style={{ fontSize: 10 }}>
                  {isExpanded ? "▼" : "▶"}
                </span>
                <span>{c.name}</span>
                {requests.length > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.6 }}>
                    ({requests.length})
                  </span>
                )}
              </div>
              {isExpanded && (
                <div style={{ paddingLeft: 16 }}>
                  {requests.length === 0 ? (
                    <div
                      style={{
                        padding: "2px 8px",
                        fontSize: 11,
                        fontStyle: "italic",
                        opacity: 0.6,
                      }}
                    >
                      No requests
                    </div>
                  ) : (
                    requests.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          padding: "2px 8px",
                          cursor: "pointer",
                          fontSize: 11,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLoadRequest(r);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--vscode-list-hoverBackground)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        {r.name || `${r.method} ${r.url}`}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* History */}
      <div style={{ padding: "4px 8px", fontWeight: 600 }}>History</div>
      <div style={{ maxHeight: 160, overflow: "auto" }}>
        {history.map((h) => (
          <div
            key={h.id}
            style={{
              padding: "2px 8px",
              cursor: "pointer",
              borderBottom: "1px solid var(--vscode-editorGroup-border)",
            }}
            onClick={() => onSelectHistory(h)}
          >
            <div>
              <strong>{h.method}</strong> {h.url}
            </div>
            <div style={{ fontSize: 10 }}>
              {h.status} • {h.duration}ms
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

