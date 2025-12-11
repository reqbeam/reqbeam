import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  exportCollection,
  importCollection,
  importSwagger,
} from "../storage/db";
import { CollectionService } from "../extension/collectionService";
import { AuthManager } from "../auth/authManager";
import { requireAuth } from "../auth/authHelper";

/**
 * Register import/export commands
 */
export function registerImportExportCommands(
  context: vscode.ExtensionContext,
  collectionService: CollectionService,
  workspaceService: { getActiveWorkspaceId: () => number | null },
  authManager?: AuthManager
): void {
  // Export Collection command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "reqbeam.collections.export",
      async (item?: { collectionId?: number }) => {
        if (authManager && !(await requireAuth(authManager, "exporting collections"))) {
          return;
        }
        try {
          const activeWorkspaceId = workspaceService.getActiveWorkspaceId();
          if (activeWorkspaceId == null) {
            await vscode.window.showWarningMessage(
              "Please select a workspace first"
            );
            return;
          }

          // Determine if exporting single collection or all
          let collectionId: number | undefined = item?.collectionId;
          let exportAll = false;

          if (!collectionId) {
            // Ask user what to export
            const choice = await vscode.window.showQuickPick(
              [
                { label: "Export Single Collection", value: "single" },
                { label: "Export All Collections", value: "all" },
              ],
              { placeHolder: "What would you like to export?" }
            );

            if (!choice) {
              return;
            }

            if (choice.value === "all") {
              exportAll = true;
            } else {
              // Get collections and let user choose
              const collections = await collectionService.getCollections(
                activeWorkspaceId
              );
              if (collections.length === 0) {
                await vscode.window.showInformationMessage(
                  "No collections to export"
                );
                return;
              }

              const selected = await vscode.window.showQuickPick(
                collections.map((c) => ({
                  label: c.name,
                  description: c.description || undefined,
                  value: c.id,
                })),
                { placeHolder: "Select a collection to export" }
              );

              if (!selected) {
                return;
              }

              collectionId = selected.value;
            }
          }

          // Show save dialog
          const defaultName = exportAll
            ? "reqbeam_collections"
            : `collection_${collectionId}`;
          const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${defaultName}.json`),
            filters: {
              JSON: ["json"],
            },
            saveLabel: exportAll ? "Export All Collections" : "Export Collection",
          });

          if (!uri) {
            return; // User cancelled
          }

          // Export collection
          const exportData = await exportCollection(
            collectionId || 0,
            exportAll
          );
          fs.writeFileSync(uri.fsPath, exportData, "utf-8");

          await vscode.window.showInformationMessage(
            exportAll
              ? "All collections exported successfully"
              : "Collection exported successfully"
          );
        } catch (error) {
          await vscode.window.showErrorMessage(
            `Failed to export collection: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    )
  );

  // Import Collection command
  context.subscriptions.push(
    vscode.commands.registerCommand("reqbeam.collections.import", async () => {
      if (authManager && !(await requireAuth(authManager, "importing collections"))) {
        return;
      }
      try {
        const activeWorkspaceId = workspaceService.getActiveWorkspaceId();
        if (activeWorkspaceId == null) {
          const createWorkspace = await vscode.window.showWarningMessage(
            "No workspace is active. Collections must be imported into a workspace.",
            { modal: true },
            "Create Workspace"
          );
          if (createWorkspace === "Create Workspace") {
            await vscode.commands.executeCommand("reqbeam.createWorkspace");
            const newWorkspaceId = workspaceService.getActiveWorkspaceId();
            if (newWorkspaceId == null) {
              await vscode.window.showErrorMessage(
                "Please create or select a workspace first."
              );
              return;
            }
          } else {
            return;
          }
        }

        // Show open dialog
        const uris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            "All Supported": ["json"],
            JSON: ["json"],
          },
          openLabel: "Import Collection",
        });

        if (!uris || uris.length === 0) {
          return; // User cancelled
        }

        const filePath = uris[0].fsPath;
        const finalWorkspaceId = workspaceService.getActiveWorkspaceId();

        // Import collection
        const result = await importCollection(filePath, finalWorkspaceId);

        // Refresh collections view
        collectionService.refresh();

        await vscode.window.showInformationMessage(
          `Successfully imported collection with ${result.requestCount} request(s)`
        );
      } catch (error) {
        await vscode.window.showErrorMessage(
          `Failed to import collection: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    })
  );

  // Import Swagger/OpenAPI command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "reqbeam.collections.importSwagger",
      async () => {
        if (authManager && !(await requireAuth(authManager, "importing Swagger/OpenAPI"))) {
          return;
        }
        try {
          const activeWorkspaceId = workspaceService.getActiveWorkspaceId();
          if (activeWorkspaceId == null) {
            const createWorkspace = await vscode.window.showWarningMessage(
              "No workspace is active. Collections must be imported into a workspace.",
              { modal: true },
              "Create Workspace"
            );
            if (createWorkspace === "Create Workspace") {
              await vscode.commands.executeCommand("reqbeam.createWorkspace");
              const newWorkspaceId = workspaceService.getActiveWorkspaceId();
              if (newWorkspaceId == null) {
                await vscode.window.showErrorMessage(
                  "Please create or select a workspace first."
                );
                return;
              }
            } else {
              return;
            }
          }

          // Show open dialog
          const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
              "All Supported": ["json", "yaml", "yml"],
              JSON: ["json"],
              YAML: ["yaml", "yml"],
            },
            openLabel: "Import Swagger/OpenAPI",
          });

          if (!uris || uris.length === 0) {
            return; // User cancelled
          }

          const filePath = uris[0].fsPath;
          const finalWorkspaceId = workspaceService.getActiveWorkspaceId();

          // Import Swagger
          const result = await importSwagger(filePath, finalWorkspaceId);

          // Refresh collections view
          collectionService.refresh();

          await vscode.window.showInformationMessage(
            `Successfully imported OpenAPI/Swagger spec with ${result.requestCount} request(s)`
          );
        } catch (error) {
          await vscode.window.showErrorMessage(
            `Failed to import Swagger/OpenAPI: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    )
  );
}

