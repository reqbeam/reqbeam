import * as vscode from "vscode";
import { initDatabase } from "./db";
import { WorkspaceService } from "./workspaceService";
import { CollectionService } from "./collectionService";
import { EnvironmentService } from "./environmentService";
import { HistoryService } from "./historyService";
import { RequestRunner } from "./requestRunner";
import { registerCommands, ReqBeamContext } from "./commands";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await initDatabase(context);

  const workspaceService = new WorkspaceService(context);
  const historyService = new HistoryService(context);
  const environmentService = new EnvironmentService(context);
  const collectionService = new CollectionService(workspaceService);
  const requestRunner = new RequestRunner({
    historyService,
    getActiveEnvironment: () => environmentService.getActiveEnvironment(),
    getActiveWorkspace: () => workspaceService.getActiveWorkspace(),
  });

  const state: ReqBeamContext = {
    panels: new Map(),
    workspaceService,
    collectionService,
    environmentService,
    historyService,
    requestRunner,
  };

  registerCommands(context, state);

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


