import * as React from "react";
import {
  HttpMethod,
  SendRequestPayload,
  SendRequestResult,
  Collection,
} from "../types/models";
import { RequestBuilder } from "./components/RequestBuilder";
import { ResponseViewer } from "./components/ResponseViewer";

export interface AppProps {
  vscode: { postMessage: (msg: unknown) => void };
}

export const App: React.FC<AppProps> = ({ vscode }) => {
  const [method, setMethod] = React.useState<HttpMethod>("GET");
  const [url, setUrl] = React.useState<string>("");
  const [headers, setHeaders] = React.useState<
    { key: string; value: string; enabled?: boolean }[]
  >([{ key: "", value: "", enabled: true }]);
  const [body, setBody] = React.useState<string>("");
  const [response, setResponse] = React.useState<SendRequestResult | null>(null);
  const [statusText, setStatusText] = React.useState<string>("");
  const [requestId, setRequestId] = React.useState<number | undefined>(undefined);
  const [requestName, setRequestName] = React.useState<string>("");
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = React.useState<number | null>(
    null
  );
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = React.useState<
    number | null
  >(null);
  const [environments, setEnvironments] = React.useState<
    Array<{ id: number; name: string; variables: Record<string, string> }>
  >([]);
  const [activeEnvId, setActiveEnvId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;
      switch (msg.type) {
        case "response":
          setResponse(msg.payload as SendRequestResult);
          setStatusText("");
          break;
        case "error":
          setStatusText(msg.message as string);
          setResponse(null);
          break;
        case "loadRequest": {
          const r = msg.payload as {
            id?: number;
            name?: string;
            method: HttpMethod;
            url: string;
            headers: string;
            body: string;
          };
          setRequestId(r.id);
          setRequestName(r.name || "");
          setMethod(r.method);
          setUrl(r.url);
          try {
            const parsed = JSON.parse(r.headers || "[]");
            setHeaders(parsed);
          } catch {
            setHeaders([{ key: "", value: "", enabled: true }]);
          }
          setBody(r.body || "");
          break;
        }
        case "loadHistory": {
          const h = msg.payload as {
            method: HttpMethod;
            url: string;
          };
          setRequestId(undefined);
          setRequestName("");
          setMethod(h.method);
          setUrl(h.url);
          setHeaders([{ key: "", value: "", enabled: true }]);
          setBody("");
          break;
        }
        case "newRequest": {
          setRequestId(undefined);
          setRequestName("");
          setMethod("GET");
          setUrl("");
          setHeaders([{ key: "", value: "", enabled: true }]);
          setBody("");
          setResponse(null);
          setStatusText("");
          break;
        }
        case "createRequest": {
          setRequestId(undefined);
          setRequestName("");
          setMethod("GET");
          setUrl("");
          setHeaders([{ key: "", value: "", enabled: true }]);
          setBody("");
          setResponse(null);
          setStatusText("");
          break;
        }
        case "sendFromCommand": {
          const payload: SendRequestPayload = {
            id: requestId,
            name: requestName,
            method,
            url,
            headers,
            body,
          };
          setStatusText("Sending...");
          vscode.postMessage({ type: "sendRequest", payload });
          break;
        }
        case "requestSaved": {
          const payload = msg.payload as { id: number };
          setRequestId(payload.id);
          setStatusText("Saved");
          break;
        }
        case "collections": {
          const payload = msg.payload as
            | Collection[]
            | {
                collections?: Collection[];
                workspaces?: unknown;
                activeWorkspaceId?: number | null;
              };
          if (Array.isArray(payload)) {
            setCollections(payload);
            setActiveWorkspaceId(null);
          } else if (payload) {
            if (Array.isArray(payload.collections)) {
              setCollections(payload.collections);
            } else {
              setCollections([]);
            }
            if (
              typeof payload.activeWorkspaceId === "number" ||
              payload.activeWorkspaceId === null
            ) {
              setActiveWorkspaceId(payload.activeWorkspaceId);
            }
          } else {
            setCollections([]);
            setActiveWorkspaceId(null);
          }
          break;
        }
        case "environments": {
          const payload = msg.payload as {
            environments: Array<{ id: number; name: string; variables: Record<string, string> }>;
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
    vscode.postMessage({ type: "getCollections" });
    vscode.postMessage({ type: "getEnvironments" });
    vscode.postMessage({ type: "getHistory" });
    return () => window.removeEventListener("message", handler);
  }, [vscode]);

  const onSend = React.useCallback(() => {
    const payload: SendRequestPayload = {
      id: requestId,
      name: requestName,
      method,
      url,
      headers,
      body,
    };
    setStatusText("Sending...");
    vscode.postMessage({ type: "sendRequest", payload });
  }, [method, url, headers, body, requestId, requestName, vscode]);

  const openSaveDialog = React.useCallback(() => {
    // Default to first collection in current workspace if none selected
    if (selectedCollectionId == null && collections.length > 0) {
      setSelectedCollectionId(collections[0].id);
    }
    setStatusText("");
    setIsSaveDialogOpen(true);
  }, [selectedCollectionId, collections]);

  const confirmSave = React.useCallback(() => {
    const finalName = (requestName || "").trim() || "New Request";

    const payload: SendRequestPayload = {
      id: requestId,
      name: finalName,
      collectionId: selectedCollectionId ?? null,
      method,
      url,
      headers,
      body,
    };
    setStatusText("Saving...");
    setRequestName(finalName);
    vscode.postMessage({ type: "saveRequest", payload });
    setIsSaveDialogOpen(false);
  }, [
    requestId,
    requestName,
    selectedCollectionId,
    method,
    url,
    headers,
    body,
    vscode,
  ]);

  const cancelSave = React.useCallback(() => {
    setIsSaveDialogOpen(false);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "var(--vscode-font-family)",
        color: "var(--vscode-editor-foreground)",
        backgroundColor: "var(--vscode-editor-background)",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          borderTop: "1px solid var(--vscode-editorGroup-border)",
          borderBottom: "1px solid var(--vscode-editorGroup-border)",
        }}
      >
        <div
          style={{
            flex: 1.05,
            minWidth: 0,
            borderRight: "1px solid var(--vscode-editorGroup-border)",
          }}
        >
          <RequestBuilder
            method={method}
            url={url}
            headers={headers}
            body={body}
            requestName={requestName}
            environments={environments}
            activeEnvId={activeEnvId}
            onMethodChange={setMethod}
            onUrlChange={setUrl}
            onHeadersChange={setHeaders}
            onBodyChange={setBody}
            onRequestNameChange={setRequestName}
            onSend={onSend}
            onSave={openSaveDialog}
            onEnvironmentChange={(envId) => {
              vscode.postMessage({ type: "setEnvironment", payload: envId });
            }}
            statusText={statusText}
            vscode={vscode}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ResponseViewer response={response} />
        </div>
      </div>

      {isSaveDialogOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--vscode-editor-background)",
              color: "var(--vscode-editor-foreground)",
              border: "1px solid var(--vscode-editorGroup-border)",
              padding: 16,
              width: 420,
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Save Request to Collection
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Request name</div>
              <input
                style={{ width: "100%" }}
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ marginBottom: 4 }}>Collection</div>
              {collections.length === 0 ? (
                <div style={{ fontStyle: "italic" }}>
                  No collections in this workspace. Create one in the sidebar
                  first.
                </div>
              ) : (
                <select
                  style={{ width: "100%" }}
                  value={selectedCollectionId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCollectionId(
                      value ? Number(value) : null
                    );
                  }}
                >
                  <option value="">(Unassigned)</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button onClick={cancelSave}>Cancel</button>
              <button
                onClick={confirmSave}
                disabled={collections.length === 0 && selectedCollectionId != null}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
