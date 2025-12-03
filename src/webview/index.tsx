import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

declare const acquireVsCodeApi: () => {
  postMessage: (msg: unknown) => void;
};

export const vscode = acquireVsCodeApi();

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App vscode={vscode} />);
}


