import * as React from "react";
import { createRoot } from "react-dom/client";
import { EnvironmentEditor, EnvironmentVariable } from "./components/EnvironmentEditor";

declare const acquireVsCodeApi: () => {
  postMessage: (msg: unknown) => void;
};

export const vscode = acquireVsCodeApi();

interface State {
  environmentId: string | null;
  environmentName: string;
  variables: EnvironmentVariable[];
}

const App: React.FC = () => {
  const [state, setState] = React.useState<State>({
    environmentId: null,
    environmentName: "",
    variables: [],
  });

  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== "object") return;

      switch (msg.type) {
        case "loadEnvironment": {
          const payload = msg.payload as {
            id: string;
            name: string;
            variables: EnvironmentVariable[];
          };
          setState({
            environmentId: payload.id,
            environmentName: payload.name,
            variables: payload.variables,
          });
          break;
        }
        case "environmentVariablesSaved": {
          // Refresh the variables
          if (state.environmentId) {
            vscode.postMessage({
              type: "getEnvironmentVariables",
              payload: { environmentId: state.environmentId },
            });
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("message", handler);
    vscode.postMessage({ type: "ready" });

    return () => {
      window.removeEventListener("message", handler);
    };
  }, [state.environmentId]);

  if (!state.environmentId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        <p>No environment selected</p>
      </div>
    );
  }

  return (
    <EnvironmentEditor
      vscode={vscode}
      environmentId={state.environmentId}
      environmentName={state.environmentName}
      variables={state.variables}
    />
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

