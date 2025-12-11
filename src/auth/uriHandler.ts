import * as vscode from "vscode";
import { AuthManager } from "./authManager";

/**
 * Register URI handler for OAuth callback
 * Handles: vscode://reqbeam/callback?token=<JWT>
 */
export function registerUriHandler(
  context: vscode.ExtensionContext,
  authManager: AuthManager,
  onTokenReceived?: () => void
): void {
  const disposable = vscode.window.registerUriHandler({
    handleUri: async (uri: vscode.Uri) => {
      // Log for debugging
      console.log("URI Handler called:", uri.toString());
      
      // Expected URI format: vscode://reqbeam/callback?token=<JWT>
      if (uri.path === "/callback") {
        const params = new URLSearchParams(uri.query);
        const token = params.get("token");
        const error = params.get("error");

        if (error) {
          vscode.window.showErrorMessage(`Authentication error: ${error}`);
          return;
        }

        if (!token) {
          vscode.window.showErrorMessage("No token received from authentication provider");
          return;
        }

        try {
          // Store token securely
          await authManager.storeToken(token);
          
          // Show success message
          vscode.window.showInformationMessage("Successfully logged in to ReqBeam!");
          
          // Small delay to ensure token is fully stored
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Notify status bar to update - ensure it's awaited
          if (onTokenReceived) {
            await onTokenReceived();
          }
          
          // Always trigger status update command as well to ensure it updates
          await vscode.commands.executeCommand("reqbeam.auth.statusUpdate");
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          vscode.window.showErrorMessage(`Failed to store authentication token: ${errorMessage}`);
          console.error("Error storing token:", err);
        }
      } else {
        console.log("URI path not recognized:", uri.path);
      }
    },
  });

  context.subscriptions.push(disposable);
}

