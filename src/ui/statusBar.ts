import * as vscode from "vscode";
import { AuthManager } from "../auth/authManager";

/**
 * Create and manage authentication status bar item
 */
export class AuthStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private authManager: AuthManager;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, authManager: AuthManager) {
    this.context = context;
    this.authManager = authManager;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "reqbeam.auth.login";
    this.statusBarItem.tooltip = "Click to login to ReqBeam";

    // Update status on activation
    this.updateStatus();

    // Register status update command
    const statusUpdateCommand = vscode.commands.registerCommand(
      "reqbeam.auth.statusUpdate",
      async () => {
        await this.updateStatus();
      }
    );
    this.context.subscriptions.push(statusUpdateCommand);
  }

  /**
   * Update status bar based on login state
   */
  async updateStatus(): Promise<void> {
    try {
      const isLoggedIn = await this.authManager.isLoggedIn();
      if (isLoggedIn) {
        this.statusBarItem.text = "$(check) ReqBeam: Logged In";
        this.statusBarItem.tooltip = "Click to logout";
        this.statusBarItem.command = "reqbeam.auth.logout";
        this.statusBarItem.backgroundColor = undefined;
      } else {
        this.statusBarItem.text = "$(sign-in) ReqBeam: Login";
        this.statusBarItem.tooltip = "Click to login to ReqBeam";
        this.statusBarItem.command = "reqbeam.auth.login";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
      }
      this.statusBarItem.show();
    } catch (error) {
      console.error("Error updating status bar:", error);
    }
  }

  /**
   * Dispose status bar item
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}

