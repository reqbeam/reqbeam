import * as vscode from "vscode";
import { initDatabase } from "./db";
import { WorkspaceService } from "./workspaceService";
import { CollectionService } from "./collectionService";
import { EnvironmentService } from "./environmentService";
import { HistoryService } from "./historyService";
import { RequestRunner } from "./requestRunner";
import { registerCommands, ReqBeamContext } from "./commands";
import { registerImportExportCommands } from "../commands/importExport";
import { AuthManager } from "../auth/authManager";
import { registerUriHandler } from "../auth/uriHandler";
import { registerLoginCommand } from "../commands/login";
import { registerLogoutCommand } from "../commands/logout";
import { AuthStatusBar } from "../ui/statusBar";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await initDatabase(context);

  const workspaceService = new WorkspaceService(context);
  const historyService = new HistoryService(context);
  const environmentService = new EnvironmentService(context);
  const collectionService = new CollectionService(workspaceService);

  // Initialize authentication system
  const authManager = new AuthManager(context);
  const statusBar = new AuthStatusBar(context, authManager);
  
  // Register URI handler for OAuth callback
  registerUriHandler(context, authManager, async () => {
    await statusBar.updateStatus();
  });

  // Register login and logout commands
  registerLoginCommand(context, authManager, async () => {
    await statusBar.updateStatus();
  });
  registerLogoutCommand(context, authManager);

  const requestRunner = new RequestRunner({
    historyService,
    getActiveEnvironment: () => environmentService.getActiveEnvironment(),
    getActiveWorkspace: () => workspaceService.getActiveWorkspace(),
    environmentManager: environmentService.getManager(),
    authManager,
  });

  const state: ReqBeamContext = {
    panels: new Map(),
    workspaceService,
    collectionService,
    environmentService,
    historyService,
    requestRunner,
    authManager,
  };

  registerCommands(context, state);
  registerImportExportCommands(context, collectionService, workspaceService, authManager);

  // Check authentication on activation and prompt if not logged in
  const isLoggedIn = await authManager.isLoggedIn();
  if (!isLoggedIn) {
    // Show welcome message after a short delay
    setTimeout(async () => {
      const result = await vscode.window.showInformationMessage(
        "Welcome to ReqBeam! Please login to start using the extension.",
        "Login",
        "Later"
      );
      if (result === "Login") {
        await vscode.commands.executeCommand("reqbeam.auth.login");
      }
    }, 1000);
  }

  vscode.window.registerTreeDataProvider(
    "reqbeam.workspacesView",
    workspaceService
  );
  vscode.window.registerTreeDataProvider(
    "reqbeam.collectionsView",
    collectionService
  );
  vscode.window.registerTreeDataProvider(
    "reqbeam.environmentsView",
    environmentService
  );
  vscode.window.registerTreeDataProvider("reqbeam.historyView", historyService);
}

export function deactivate(): void {
  // noop
}


