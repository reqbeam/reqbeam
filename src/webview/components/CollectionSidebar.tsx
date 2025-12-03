import * as React from "react";
import { Workspace } from "../../types/models";

interface Collection {
  id: number;
  name: string;
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

  const onSetEnvironment = (id: number | null) => {
    vscode.postMessage({ type: "setEnvironment", payload: id });
  };

  const onSetWorkspace = (id: number | null) => {
    setActiveWorkspaceId(id);
    vscode.postMessage({ type: "setWorkspace", payload: id });
  };

  const onCreateWorkspace = () => {
    vscode.postMessage({ type: "createWorkspace" });
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
      <div style={{ padding: "4px 8px", fontWeight: 600 }}>Environments</div>
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

      {/* Collections */}
      <div style={{ padding: "4px 8px", fontWeight: 600 }}>Collections</div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {collections.map((c) => (
          <div key={c.id} style={{ padding: "2px 8px" }}>
            {c.name}
          </div>
        ))}
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

