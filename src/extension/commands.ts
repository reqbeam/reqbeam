import * as vscode from "vscode";
import { WorkspaceService, WorkspaceTreeItem } from "./workspaceService";
import { CollectionService, CollectionTreeItem } from "./collectionService";
import { EnvironmentService } from "./environmentService";
import { HistoryService } from "./historyService";
import { RequestRunner } from "./requestRunner";
import { SendRequestPayload } from "../types/models";
import { getParams, setParams } from "../storage/params";
import { getAuth, saveAuth } from "../storage/auth";
import { AuthManager } from "../auth/authManager";
import { requireAuth } from "../auth/authHelper";

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
  authManager?: AuthManager;
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
    vscode.commands.registerCommand("reqbeam.sendRequest", async () => {
      if (state.authManager && !(await requireAuth(state.authManager, "sending requests"))) {
        return;
      }
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
    vscode.commands.registerCommand("reqbeam.showCollections", async () => {
      if (state.authManager && !(await requireAuth(state.authManager, "viewing collections"))) {
        return;
      }
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
    vscode.commands.registerCommand("reqbeam.showHistory", async () => {
      if (state.authManager && !(await requireAuth(state.authManager, "viewing history"))) {
        return;
      }
      const key = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const panel = createOrRevealWebview(context, state, key, "ReqBeam");
      void sendHistoryToWebview(panel, state);
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.loadRequest",
      async (request: unknown) => {
        if (state.authManager && !(await requireAuth(state.authManager, "loading requests"))) {
          return;
        }
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
      if (state.authManager && !(await requireAuth(state.authManager, "creating environments"))) {
        return;
      }
      const name = await vscode.window.showInputBox({
        prompt: "Environment name",
        placeHolder: "e.g. Development",
      });
      if (!name) {
        return;
      }
      try {
        await state.environmentService.createEnvironment(name);
        vscode.window.showInformationMessage(`Environment "${name}" created successfully`);
        // Broadcast to all open panels
        for (const panelInfo of state.panels.values()) {
          await sendEnvironmentsToWebview(panelInfo.panel, state);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create environment: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameEnvironment",
      async (env: { id: number; name: string }) => {
        if (state.authManager && !(await requireAuth(state.authManager, "renaming environments"))) {
          return;
        }
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
        if (state.authManager && !(await requireAuth(state.authManager, "deleting environments"))) {
          return;
        }
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
    vscode.commands.registerCommand(
      "reqbeam.duplicateEnvironment",
      async (env: { id: number; name: string }) => {
        if (state.authManager && !(await requireAuth(state.authManager, "duplicating environments"))) {
          return;
        }
        const newName = await vscode.window.showInputBox({
          prompt: "New environment name",
          value: `${env.name} (Copy)`,
        });
        if (!newName) {
          return;
        }
        try {
          await state.environmentService.duplicateEnvironment(env.id, newName);
          vscode.window.showInformationMessage(`Environment "${newName}" created successfully`);
          // Broadcast to all open panels
          for (const panelInfo of state.panels.values()) {
            await sendEnvironmentsToWebview(panelInfo.panel, state);
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to duplicate environment: ${error instanceof Error ? error.message : String(error)}`
          );
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
      async (workspace: { id: string | number }) => {
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
      if (state.authManager && !(await requireAuth(state.authManager, "creating collections"))) {
        return;
      }
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
      // Convert workspaceId to string if it's a number (for backward compatibility)
      const workspaceIdStr = activeWorkspaceId != null ? String(activeWorkspaceId) : null;
      await state.collectionService.createCollection(
        name,
        workspaceIdStr,
        description || undefined
      );
    })
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.createRequest",
      async (item?: { workspaceId?: number; collectionId?: number }) => {
        if (state.authManager && !(await requireAuth(state.authManager, "creating requests"))) {
          return;
        }
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
      "reqbeam.showCollectionMenu",
      async (item: CollectionTreeItem) => {
        if (!item.collectionId) {
          return;
        }
        const options = [
          { label: "$(edit) Rename Collection", id: "rename" },
          { label: "$(trash) Delete Collection", id: "delete" },
        ];
        const selected = await vscode.window.showQuickPick(options, {
          placeHolder: "Select an action",
        });
        if (!selected) {
          return;
        }
        switch (selected.id) {
          case "rename":
            await vscode.commands.executeCommand("reqbeam.renameCollection", item);
            break;
          case "delete":
            await vscode.commands.executeCommand("reqbeam.deleteCollection", item);
            break;
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.showWorkspaceMenu",
      async (item: WorkspaceTreeItem | { workspaceId?: number; id?: number }) => {
        const workspaceId = (item as any).workspaceId || (item as any).id;
        if (!workspaceId) {
          return;
        }
        const options = [
          { label: "$(edit) Rename Workspace", id: "rename" },
          { label: "$(trash) Delete Workspace", id: "delete" },
        ];
        const selected = await vscode.window.showQuickPick(options, {
          placeHolder: "Select an action",
        });
        if (!selected) {
          return;
        }
        switch (selected.id) {
          case "rename":
            await vscode.commands.executeCommand("reqbeam.renameWorkspace", item);
            break;
          case "delete":
            await vscode.commands.executeCommand("reqbeam.deleteWorkspace", item);
            break;
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.showEnvironmentMenu",
      async (item: { id: number; name: string }) => {
        if (!item.id) {
          return;
        }
        const options = [
          { label: "$(edit) Edit Variables", id: "edit" },
          { label: "$(add) Add Variable", id: "addVariable" },
          { label: "$(edit) Rename Environment", id: "rename" },
          { label: "$(copy) Duplicate Environment", id: "duplicate" },
          { label: "$(trash) Delete Environment", id: "delete" },
        ];
        const selected = await vscode.window.showQuickPick(options, {
          placeHolder: "Select an action",
        });
        if (!selected) {
          return;
        }
        switch (selected.id) {
          case "edit":
            await vscode.commands.executeCommand("reqbeam.openEnvironmentEditor", item);
            break;
          case "addVariable":
            await vscode.commands.executeCommand("reqbeam.addEnvironmentVariable", item);
            break;
          case "rename":
            await vscode.commands.executeCommand("reqbeam.renameEnvironment", item);
            break;
          case "duplicate":
            await vscode.commands.executeCommand("reqbeam.duplicateEnvironment", item);
            break;
          case "delete":
            await vscode.commands.executeCommand("reqbeam.deleteEnvironment", item);
            break;
        }
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameRequest",
      async (item: CollectionTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "renaming requests"))) {
          return;
        }
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
        if (state.authManager && !(await requireAuth(state.authManager, "editing requests"))) {
          return;
        }
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
        // Load params and auth
        const params = await getParams(req.id);
        const auth = await getAuth(req.id);
        panel.webview.postMessage({
          type: "loadParams",
          payload: { params },
        });
        panel.webview.postMessage({
          type: "loadAuth",
          payload: { auth },
        });
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.deleteRequest",
      async (item: CollectionTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "deleting requests"))) {
          return;
        }
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

  // Collection rename and delete commands
  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameCollection",
      async (item: CollectionTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "renaming collections"))) {
          return;
        }
        if (!item.collectionId) {
          return;
        }
        const collection = await state.collectionService.getCollectionById(item.collectionId);
        const currentName = collection?.name || "";
        const name = await vscode.window.showInputBox({
          prompt: "New collection name",
          value: currentName,
        });
        if (!name) {
          return;
        }
        await state.collectionService.renameCollection(item.collectionId, name);
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.deleteCollection",
      async (item: CollectionTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "deleting collections"))) {
          return;
        }
        if (!item.collectionId) {
          return;
        }
        const collection = await state.collectionService.getCollectionById(item.collectionId);
        const name = collection?.name || "this collection";
        const confirm = await vscode.window.showWarningMessage(
          `Delete collection "${name}" and all its requests?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete") {
          return;
        }
        await state.collectionService.deleteCollection(item.collectionId);
      }
    )
  );

  // Workspace rename and delete commands
  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.renameWorkspace",
      async (item: { workspaceId?: number } | WorkspaceTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "renaming workspaces"))) {
          return;
        }
        const workspaceId = (item as any).workspaceId || (item as any).id;
        if (!workspaceId) {
          return;
        }
        const workspace = await state.workspaceService.getWorkspaceById(workspaceId);
        const currentName = workspace?.name || "";
        const name = await vscode.window.showInputBox({
          prompt: "New workspace name",
          value: currentName,
        });
        if (!name) {
          return;
        }
        await state.workspaceService.renameWorkspace(workspaceId, name);
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.deleteWorkspace",
      async (item: { workspaceId?: number } | WorkspaceTreeItem) => {
        if (state.authManager && !(await requireAuth(state.authManager, "deleting workspaces"))) {
          return;
        }
        const workspaceId = (item as any).workspaceId || (item as any).id;
        if (!workspaceId) {
          return;
        }
        const workspace = await state.workspaceService.getWorkspaceById(workspaceId);
        const name = workspace?.name || "this workspace";
        const confirm = await vscode.window.showWarningMessage(
          `Delete workspace "${name}" and all its collections and requests?`,
          { modal: true },
          "Delete"
        );
        if (confirm !== "Delete") {
          return;
        }
        await state.workspaceService.deleteWorkspace(workspaceId);
      }
    )
  );

  // Environment variable commands
  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.openEnvironmentEditor",
      async (env: { id: string | number; name: string }) => {
        if (state.authManager && !(await requireAuth(state.authManager, "editing environment variables"))) {
          return;
        }
        // Create a virtual document URI for the environment (ID is now a string CUID)
        const envId = String(env.id);
        const uri = vscode.Uri.parse(`reqbeam-env://environment/${envId}`);
        await vscode.commands.executeCommand(
          "vscode.openWith",
          uri,
          "reqbeam.environmentVariableEditor"
        );
      }
    )
  );

  disposables.push(
    vscode.commands.registerCommand(
      "reqbeam.addEnvironmentVariable",
      async (env: { id: string | number; name: string }) => {
        if (state.authManager && !(await requireAuth(state.authManager, "adding environment variables"))) {
          return;
        }
        const key = await vscode.window.showInputBox({
          prompt: "Variable key",
          placeHolder: "e.g. API_URL",
          validateInput: (value) => {
            if (!value || !value.trim()) {
              return "Variable key cannot be empty";
            }
            if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
              return "Variable key can only contain letters, numbers, and underscores";
            }
            return null;
          },
        });
        if (!key) {
          return;
        }
        const value = await vscode.window.showInputBox({
          prompt: "Variable value",
          placeHolder: "e.g. https://api.example.com",
        });
        if (value === undefined) {
          return; // User cancelled
        }
        try {
          await state.environmentService.getManager().setVariable(
            String(env.id),
            key.trim(),
            value || ""
          );
          state.environmentService.refresh();
          vscode.window.showInformationMessage(`Variable "${key.trim()}" added to environment "${env.name}"`);
          // Refresh environments in all panels
          for (const panelInfo of state.panels.values()) {
            await sendEnvironmentsToWebview(panelInfo.panel, state);
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to add variable: ${error instanceof Error ? error.message : String(error)}`
          );
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
        if (state.authManager && !(await requireAuth(state.authManager, "sending requests"))) {
          panel.webview.postMessage({
            type: "error",
            message: "Authentication required. Please login to send requests.",
          });
          return;
        }
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
        if (state.authManager && !(await requireAuth(state.authManager, "saving requests"))) {
          panel.webview.postMessage({
            type: "error",
            message: "Authentication required. Please login to save requests.",
          });
          return;
        }
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
        
        // Load params and auth for the saved request
        if (id) {
          const params = await getParams(id);
          const auth = await getAuth(id);
          panel.webview.postMessage({
            type: "loadParams",
            payload: { params },
          });
          panel.webview.postMessage({
            type: "loadAuth",
            payload: { auth },
          });
        }
        break;
      }
      case "getParams": {
        const payload = msg.payload as { requestId: number };
        const params = await getParams(payload.requestId);
        panel.webview.postMessage({
          type: "loadParams",
          payload: { params },
        });
        break;
      }
      case "saveParams": {
        const payload = msg.payload as {
          requestId: number;
          params: Array<{ key: string; value: string; active: boolean }>;
        };
        await setParams(payload.requestId, payload.params);
        break;
      }
      case "getAuth": {
        const payload = msg.payload as { requestId: number };
        const auth = await getAuth(payload.requestId);
        panel.webview.postMessage({
          type: "loadAuth",
          payload: { auth },
        });
        break;
      }
      case "saveAuth": {
        const payload = msg.payload as {
          requestId: number;
          auth: { type: string; [key: string]: unknown } | null;
        };
        if (payload.auth && payload.auth.type !== "none") {
          await saveAuth(payload.requestId, payload.auth as any);
        } else {
          // Delete auth if type is none
          const { deleteAuth } = await import("../storage/auth");
          await deleteAuth(payload.requestId);
        }
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
      case "saveEnvironmentVariables": {
        if (state.authManager && !(await requireAuth(state.authManager, "saving environment variables"))) {
          panel.webview.postMessage({
            type: "error",
            message: "Authentication required. Please login to save environment variables.",
          });
          return;
        }
        const payload = msg.payload as {
          environmentId: number;
          variables: Record<string, string>;
        };
        try {
          await state.environmentService.updateEnvironmentVariables(
            payload.environmentId,
            payload.variables
          );
          panel.webview.postMessage({
            type: "environmentVariablesSaved",
            payload: { environmentId: payload.environmentId },
          });
          // Refresh environments in all panels
          for (const panelInfo of state.panels.values()) {
            await sendEnvironmentsToWebview(panelInfo.panel, state);
          }
        } catch (error) {
          panel.webview.postMessage({
            type: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
        break;
      }
      case "getEnvironmentVariables": {
        const payload = msg.payload as { environmentId: number };
        const env = await state.environmentService.getEnvironmentById(payload.environmentId);
        if (env) {
          const variables = await state.environmentService.getManager().getVariables(String(payload.environmentId));
          panel.webview.postMessage({
            type: "loadEnvironmentVariables",
            payload: {
              environmentId: String(payload.environmentId),
              variables: variables.map(v => ({ id: v.id, key: v.key, value: v.value })),
            },
          });
        }
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

function getEnvironmentEditorHtml(scriptUri: string, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Environment Editor</title>
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
  const activeIdStr = state.environmentService.getActiveEnvironmentId();
  // Convert string ID to number for consistency
  const activeId = activeIdStr ? Number(activeIdStr) : null;
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


