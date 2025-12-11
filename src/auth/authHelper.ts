import * as vscode from "vscode";
import { AuthManager } from "./authManager";

/**
 * Check if user is authenticated, show login prompt if not
 * Returns true if authenticated, false otherwise
 */
export async function requireAuth(
  authManager: AuthManager,
  featureName: string = "this feature"
): Promise<boolean> {
  const isLoggedIn = await authManager.isLoggedIn();
  if (!isLoggedIn) {
    const result = await vscode.window.showWarningMessage(
      `Authentication required. Please login to use ${featureName}.`,
      "Login",
      "Cancel"
    );
    if (result === "Login") {
      await vscode.commands.executeCommand("reqbeam.auth.login");
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await authManager.isLoggedIn();
    }
    return false;
  }
  return true;
}

