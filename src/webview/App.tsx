import * as React from "react";
import {
  HttpMethod,
  SendRequestPayload,
  SendRequestResult,
  Collection,
  RequestParam,
  RequestAuth,
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
  const [params, setParams] = React.useState<RequestParam[]>([]);
  const [auth, setAuth] = React.useState<RequestAuth | null>(null);

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
          // Request params and auth
          if (r.id) {
            vscode.postMessage({ type: "getParams", payload: { requestId: r.id } });
            vscode.postMessage({ type: "getAuth", payload: { requestId: r.id } });
          } else {
            setParams([]);
            setAuth(null);
          }
          break;
        }
        case "loadParams": {
          const payload = msg.payload as { params: RequestParam[] };
          setParams(payload.params || []);
          break;
        }
        case "loadAuth": {
          const payload = msg.payload as { auth: RequestAuth | null };
          setAuth(payload.auth);
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
          setParams([]);
          setAuth(null);
          break;
        }
        case "newRequest": {
          setRequestId(undefined);
          setRequestName("");
          setMethod("GET");
          setUrl("");
          setHeaders([{ key: "", value: "", enabled: true }]);
          setBody("");
          setParams([]);
          setAuth(null);
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
          setParams([]);
          setAuth(null);
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
            environments: Array<{ id: number; name: string; variables: string | Record<string, string> }>;
            activeId: number | null;
          };
          console.log("Received environments:", payload.environments.length, payload.environments);
          // Parse variables if they're JSON strings
          const parsedEnvironments = payload.environments.map(env => {
            let variables: Record<string, string> = {};
            console.log("Processing env:", env.name, "variables type:", typeof env.variables, "value:", env.variables);
            if (typeof env.variables === "string") {
              try {
                variables = JSON.parse(env.variables);
                console.log("Parsed variables:", Object.keys(variables).length, variables);
              } catch (e) {
                console.error("Failed to parse environment variables:", e, env.variables);
                variables = {};
              }
            } else {
              variables = env.variables;
              console.log("Variables already object:", Object.keys(variables).length, variables);
            }
            return {
              ...env,
              variables,
            };
          });
          console.log("Final parsed environments:", parsedEnvironments);
          console.log("Setting activeEnvId to:", payload.activeId, "type:", typeof payload.activeId);
          setEnvironments(parsedEnvironments);
          setActiveEnvId(payload.activeId);
          // Also try to find active by isActive flag as fallback
          if (payload.activeId === null || payload.activeId === undefined) {
            const activeByFlag = parsedEnvironments.find(e => e.isActive);
            if (activeByFlag) {
              console.log("Found active environment by isActive flag:", activeByFlag.id);
              setActiveEnvId(activeByFlag.id);
            }
          }
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
      params: params.length > 0 ? params : undefined,
      authConfig: auth || undefined,
    };
    setStatusText("Sending...");
    vscode.postMessage({ type: "sendRequest", payload });
  }, [method, url, headers, body, params, auth, requestId, requestName, vscode]);

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
    
    // Save params and auth after request is saved
    if (requestId || params.length > 0 || auth) {
      vscode.postMessage({ 
        type: "saveParams", 
        payload: { requestId: requestId || 0, params } 
      });
      vscode.postMessage({ 
        type: "saveAuth", 
        payload: { requestId: requestId || 0, auth } 
      });
    }
    
    setIsSaveDialogOpen(false);
  }, [
    requestId,
    requestName,
    selectedCollectionId,
    method,
    url,
    headers,
    body,
    params,
    auth,
    vscode,
  ]);
  
  // Auto-save params and auth when they change (debounced)
  React.useEffect(() => {
    if (!requestId) return;
    
    const timeoutId = setTimeout(() => {
      if (params.length > 0 || auth) {
        vscode.postMessage({ 
          type: "saveParams", 
          payload: { requestId, params } 
        });
        if (auth) {
          vscode.postMessage({ 
            type: "saveAuth", 
            payload: { requestId, auth } 
          });
        }
      }
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timeoutId);
  }, [params, auth, requestId, vscode]);

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
            params={params}
            auth={auth}
            environments={environments}
            activeEnvId={activeEnvId}
            onMethodChange={setMethod}
            onUrlChange={setUrl}
            onHeadersChange={setHeaders}
            onBodyChange={setBody}
            onParamsChange={setParams}
            onAuthChange={setAuth}
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
