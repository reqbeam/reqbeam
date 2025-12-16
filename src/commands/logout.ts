import * as vscode from "vscode";
import { AuthManager } from "../auth/authManager";
import { stopLoginServer } from "./login";

/**
 * Register logout command
 */
export function registerLogoutCommand(
  context: vscode.ExtensionContext,
  authManager: AuthManager
): void {
  const disposable = vscode.commands.registerCommand("reqbeam.auth.logout", async () => {
    const isLoggedIn = await authManager.isLoggedIn();
    if (!isLoggedIn) {
      vscode.window.showInformationMessage("You are not logged in");
      return;
    }

    const result = await vscode.window.showWarningMessage(
      "Are you sure you want to logout?",
      "Logout",
      "Cancel"
    );

    if (result === "Logout") {
      await authManager.deleteToken();
      vscode.window.showInformationMessage("Logged out successfully");
      
      // Update status bar
      await vscode.commands.executeCommand("reqbeam.auth.statusUpdate");

      // Ensure local login server (port 5000) is stopped after logout
      stopLoginServer();
      
      // Refresh all services to clear user data from UI
      await vscode.commands.executeCommand("reqbeam.refreshAll");
    }
  });

  context.subscriptions.push(disposable);
}

