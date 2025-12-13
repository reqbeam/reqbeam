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
import { EnvironmentVariableEditorProvider } from "../editors/environmentVariableEditor";

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

  // Register document content provider for environment editor URIs
  const envDocumentProvider = new (class implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
      // Return empty content - the custom editor will load the actual data
      return "";
    }
  })();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      "reqbeam-env",
      envDocumentProvider
    )
  );

  // Register custom editor for environment variables
  const envEditorProvider = new EnvironmentVariableEditorProvider(
    context,
    environmentService,
    authManager
  );
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "reqbeam.environmentVariableEditor",
      envEditorProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );
}

export function deactivate(): void {
  // noop
}


