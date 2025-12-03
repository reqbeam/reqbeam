import * as vscode from "vscode";
import { WorkspaceService } from "./workspaceService";
import { CollectionService, CollectionTreeItem } from "./collectionService";
import { EnvironmentService } from "./environmentService";
import { HistoryService } from "./historyService";
import { RequestRunner } from "./requestRunner";
import { SendRequestPayload } from "../types/models";

interface PanelInfo {
  panel: vscode.WebviewPanel;
  requestId?: number;
}

export interface ReqBeamContext {
  panels: Map<string, PanelInfo>; // key: requestId or "new" for new requests
  workspaceService: WorkspaceService;
  collectionService: CollectionService;
  environmentService: EnvironmentService;
  historyService: HistoryService;
  requestRunner: RequestRunner;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  state: ReqBeamContext
): void {
  const disposables: vscode.Disposable[] = [];

  disposables.push(
    vscode.commands.registerCommand("reqbeam.newRequest", () => {
      // Create a unique key for each new request
      const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const panel = createOrRevealWebview(context, state, key, "New Request");
      panel.webview.postMessage({ type: "newRequest" });
    })
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.sendRequest", () => {
      // Find the first available panel or create a new one
      const panelInfo = Array.from(state.panels.values())[0];
      if (panelInfo) {
        panelInfo.panel.reveal();
        panelInfo.panel.webview.postMessage({ type: "sendFromCommand" });
      } else {
        const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const panel = createOrRevealWebview(context, state, key, "New Request");
        panel.webview.postMessage({ type: "sendFromCommand" });
      }
    })
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.showCollections", () => {
      const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const panel = createOrRevealWebview(context, state, key, "ReqBeam");
      void sendCollectionsToWebview(panel, state);
    })
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.showEnvironments", () => {
      const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const panel = createOrRevealWebview(context, state, key, "ReqBeam");
      void sendEnvironmentsToWebview(panel, state);
    })
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.showHistory", () => {
      const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const panel = createOrRevealWebview(context, state, key, "ReqBeam");
      void sendHistoryToWebview(panel, state);
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.loadRequest",
      async (request: unknown) => {
        const req = request as { id?: number; name?: string };
        const key = req.id != null ? `req-${req.id}` : "new";
        const title = req.name || "New Request";
        const panel = createOrRevealWebview(context, state, key, title);
        panel.webview.postMessage({
          type: "loadRequest",
          payload: request,
        });
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.setEnvironment",
      async (env: { id: number }) => {
        await state.environmentService.setActiveEnvironment(env.id);
        // Broadcast to all open panels
        for (const panelInfo of state.panels.values()) {
          await sendEnvironmentsToWebview(panelInfo.panel, state);
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.showHistoryItem",
      async (entry: unknown) => {
        const hist = entry as { method?: string; url?: string };
        const title = hist.url || "History Request";
        const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const panel = createOrRevealWebview(context, state, key, title);
        panel.webview.postMessage({
          type: "loadHistory",
          payload: entry,
        });
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.addEnvironment", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "Environment name",
        placeHolder: "e.g. Development",
      });
      if (!name) {
        return;
      }
      await state.environmentService.createEnvironment(name);
      // Broadcast to all open panels
      for (const panelInfo of state.panels.values()) {
        await sendEnvironmentsToWebview(panelInfo.panel, state);
      }
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameEnvironment",
      async (env: { id: number; name: string }) => {
        const name = await vscode.window.showInputBox({
          prompt: "New environment name",
          value: env.name,
        });
        if (!name) {
          return;
        }
        await state.environmentService.renameEnvironment(env.id, name);
        // Broadcast to all open panels
        for (const panelInfo of state.panels.values()) {
          await sendEnvironmentsToWebview(panelInfo.panel, state);
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.deleteEnvironment",
      async (env: { id: number; name: string }) => {
        const confirm = await vscode.window.showWarningMessage(
          `Delete environment "${env.name}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete") {
          return;
        }
        await state.environmentService.deleteEnvironment(env.id);
        // Broadcast to all open panels
        for (const panelInfo of state.panels.values()) {
          await sendEnvironmentsToWebview(panelInfo.panel, state);
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.createWorkspace", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "Workspace name",
        placeHolder: "e.g. My Project",
      });
      if (!name) {
        return;
      }
      const description = await vscode.window.showInputBox({
        prompt: "Workspace description (optional)",
        placeHolder: "Optional description",
      });
      const id = await state.workspaceService.createWorkspace(
        name,
        description || undefined
      );
      await state.workspaceService.setActiveWorkspace(id);
      state.collectionService.refresh();
      state.environmentService.refresh();
      state.historyService.refresh();
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.setWorkspace",
      async (workspace: { id: number }) => {
        await state.workspaceService.setActiveWorkspace(workspace.id);
        state.collectionService.refresh();
        state.environmentService.refresh();
        state.historyService.refresh();
        // Broadcast to all open panels
        for (const panelInfo of state.panels.values()) {
          await sendCollectionsToWebview(panelInfo.panel, state);
          await sendEnvironmentsToWebview(panelInfo.panel, state);
          await sendHistoryToWebview(panelInfo.panel, state);
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand("reqbeam.createCollection", async () => {
      const activeWorkspaceId = state.workspaceService.getActiveWorkspaceId();
      if (activeWorkspaceId == null) {
        await vscode.window.showWarningMessage(
          "Please select a workspace first"
        );
        return;
      }
      const name = await vscode.window.showInputBox({
        prompt: "Collection name",
        placeHolder: "e.g. API Endpoints",
      });
      if (!name) {
        return;
      }
      const description = await vscode.window.showInputBox({
        prompt: "Collection description (optional)",
        placeHolder: "Optional description",
      });
      await state.collectionService.createCollection(
        name,
        activeWorkspaceId,
        description || undefined
      );
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.createRequest",
      async (item?: { workspaceId?: number; collectionId?: number }) => {
        // Determine workspace and collection from the clicked tree item or active workspace
        const activeWorkspaceId =
          item?.workspaceId ?? state.workspaceService.getActiveWorkspaceId();
        if (activeWorkspaceId == null) {
          await vscode.window.showWarningMessage(
            "Please select a workspace first"
          );
          return;
        }

        const collectionId = item?.collectionId ?? null;

        const name = await vscode.window.showInputBox({
          prompt: "Request name",
          placeHolder: "e.g. Get Users",
        });
        if (!name) {
          return;
        }

        // Create a minimal placeholder request, like creating a new file in a folder
        const headersJson = JSON.stringify([]);
        const id = await state.collectionService.saveRequest({
          id: undefined,
          collectionId,
          workspaceId: activeWorkspaceId,
          name,
          method: "GET",
          url: "",
          headers: headersJson,
          body: "",
          bodyType: undefined,
          auth: undefined,
        });

        // Load the newly created request into a new webview panel
        const created = await state.collectionService.getRequestById(id);
        if (created) {
          const key = `req-${id}`;
          const title = created.name || "New Request";
          const panel = createOrRevealWebview(context, state, key, title);
          panel.webview.postMessage({
            type: "loadRequest",
            payload: created,
          });
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.showRequestMenu",
      async (item: CollectionTreeItem) => {
        if (!item.requestId) {
          return;
        }
        const options = [
          { label: "$(edit) Edit Request", id: "edit" },
          { label: "$(edit) Rename Request", id: "rename" },
          { label: "$(trash) Delete Request", id: "delete" },
        ];
        const selected = await vscode.window.showQuickPick(options, {
          placeHolder: "Select an action",
        });
        if (!selected) {
          return;
        }
        switch (selected.id) {
          case "edit":
            await vscode.commands.executeCommand("reqbeam.editRequest", item);
            break;
          case "rename":
            await vscode.commands.executeCommand("reqbeam.renameRequest", item);
            break;
          case "delete":
            await vscode.commands.executeCommand("reqbeam.deleteRequest", item);
            break;
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameRequest",
      async (item: CollectionTreeItem) => {
        if (!item.requestId) {
          return;
        }
        // Get current request to get the name
        const req = await state.collectionService.getRequestById(item.requestId);
        const currentName = req?.name || (item as any).requestName || "";
        const name = await vscode.window.showInputBox({
          prompt: "New request name",
          value: currentName,
        });
        if (!name) {
          return;
        }
        await state.collectionService.renameRequest(item.requestId, name);
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.editRequest",
      async (item: CollectionTreeItem) => {
        if (!item.requestId) {
          return;
        }
        const req = await state.collectionService.getRequestById(item.requestId);
        if (!req) {
          await vscode.window.showErrorMessage("Request not found");
          return;
        }
        const key = `req-${req.id}`;
        const title = req.name || "New Request";
        const panel = createOrRevealWebview(context, state, key, title);
        panel.webview.postMessage({
          type: "loadRequest",
          payload: req,
        });
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.deleteRequest",
      async (item: CollectionTreeItem) => {
        if (!item.requestId) {
          return;
        }
        const req = await state.collectionService.getRequestById(item.requestId);
        const name = req?.name || (item as any).requestName || "this request";
        const confirm = await vscode.window.showWarningMessage(
          `Delete request "${name}"?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete") {
          return;
        }
        await state.collectionService.deleteRequest(item.requestId);
        // Close the panel if it's open
        const key = `req-${item.requestId}`;
        const panelInfo = state.panels.get(key);
        if (panelInfo) {
          panelInfo.panel.dispose();
        }
      }
    )
  );

  disposables.forEach((d) => context.subscriptions.push(d));
}

export function createOrRevealWebview(
  context: vscode.ExtensionContext,
  state: ReqBeamContext,
  key: string,
  title: string
): vscode.WebviewPanel {
  const existing = state.panels.get(key);
  if (existing) {
    existing.panel.reveal();
    existing.panel.title = title;
    return existing.panel;
  }

  const panel = vscode.window.createWebviewPanel(
    "reqbeam",
    title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "dist", "webview.js")
  );

  const nonce = Date.now().toString();

  panel.webview.html = getWebviewHtml(scriptUri.toString(), nonce);

  const requestId = key.startsWith("req-") ? Number(key.replace("req-", "")) : undefined;

  state.panels.set(key, { panel, requestId });

  panel.onDidDispose(() => {
    state.panels.delete(key);
  });

  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg.type) {
      case "sendRequest": {
        const payload = msg.payload as SendRequestPayload;
        try {
          const result = await state.requestRunner.sendRequest(payload);
          panel.webview.postMessage({
            type: "response",
            payload: result,
          });
          await sendHistoryToWebview(panel, state);
        } catch (err: unknown) {
          panel.webview.postMessage({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
        break;
      }
      case "saveRequest": {
        const request = msg.payload as SendRequestPayload & {
          id?: number;
          collectionId?: number | null;
          workspaceId?: number | null;
          name?: string;
        };
        const activeWorkspaceId =
          state.workspaceService.getActiveWorkspaceId();
        const headersJson = JSON.stringify(request.headers ?? []);
        const id = await state.collectionService.saveRequest({
          id: request.id,
          collectionId: request.collectionId ?? null,
          workspaceId: request.workspaceId ?? activeWorkspaceId ?? null,
          name: request.name ?? "",
          method: request.method,
          url: request.url,
          headers: headersJson,
          body: request.body ?? "",
          bodyType: request.bodyType,
          auth: request.auth,
        });
        
        // Update panel title and key if this was a new request
        if (request.id == null && id != null) {
          const newKey = `req-${id}`;
          // Find the current key for this panel
          let currentKey: string | undefined;
          for (const [k, info] of state.panels.entries()) {
            if (info.panel === panel) {
              currentKey = k;
              break;
            }
          }
          if (currentKey) {
            const panelInfo = state.panels.get(currentKey);
            if (panelInfo) {
              state.panels.delete(currentKey);
              panelInfo.requestId = id;
              state.panels.set(newKey, panelInfo);
              panel.title = request.name || "New Request";
            }
          }
        } else if (id != null) {
          panel.title = request.name || "New Request";
        }
        
        panel.webview.postMessage({
          type: "requestSaved",
          payload: { id },
        });
        await sendCollectionsToWebview(panel, state);
        break;
      }
      case "getCollections": {
        await sendCollectionsToWebview(panel, state);
        break;
      }
      case "getEnvironments": {
        await sendEnvironmentsToWebview(panel, state);
        break;
      }
      case "setEnvironment": {
        const envId = msg.payload as number | null;
        await state.environmentService.setActiveEnvironment(envId);
        await sendEnvironmentsToWebview(panel, state);
        break;
      }
      case "getHistory": {
        await sendHistoryToWebview(panel, state);
        break;
      }
      case "loadHistory": {
        // Echo back to app so it can populate the builder from history
        panel.webview.postMessage({
          type: "loadHistory",
          payload: msg.payload,
        });
        break;
      }
      case "setWorkspace": {
        const workspaceId = msg.payload as number | null;
        if (workspaceId == null) {
          await state.workspaceService.setActiveWorkspace(null);
        } else {
          await state.workspaceService.setActiveWorkspace(workspaceId);
        }
        state.collectionService.refresh();
        state.environmentService.refresh();
        state.historyService.refresh();
        await sendCollectionsToWebview(panel, state);
        await sendEnvironmentsToWebview(panel, state);
        await sendHistoryToWebview(panel, state);
        break;
      }
      case "createWorkspace": {
        await vscode.commands.executeCommand("reqbeam.createWorkspace");
        await sendCollectionsToWebview(panel, state);
        break;
      }
      default:
        break;
    }
  });

  return panel;
}

function getWebviewHtml(scriptUri: string, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ReqBeam</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

async function sendCollectionsToWebview(
  panel: vscode.WebviewPanel,
  state: ReqBeamContext
): Promise<void> {
  const activeWorkspaceId = state.workspaceService.getActiveWorkspaceId();
  const collections = await state.collectionService.getCollections(
    activeWorkspaceId
  );
  const workspaces = await state.workspaceService.getWorkspaces();
  panel.webview.postMessage({
    type: "collections",
    payload: { collections, workspaces, activeWorkspaceId },
  });
}

async function sendEnvironmentsToWebview(
  panel: vscode.WebviewPanel,
  state: ReqBeamContext
): Promise<void> {
  const activeWorkspaceId = state.workspaceService.getActiveWorkspaceId();
  const envs = await state.environmentService.getEnvironments(
    activeWorkspaceId
  );
  const activeId = state.environmentService.getActiveEnvironmentId();
  panel.webview.postMessage({
    type: "environments",
    payload: { environments: envs, activeId },
  });
}

async function sendHistoryToWebview(
  panel: vscode.WebviewPanel,
  state: ReqBeamContext
): Promise<void> {
  const activeWorkspaceId = state.workspaceService.getActiveWorkspaceId();
  const history = await state.historyService.getRecent(50, activeWorkspaceId);
  panel.webview.postMessage({
    type: "history",
    payload: history,
  });
}


