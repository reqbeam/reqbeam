import * as vscode from "vscode";

/**
 * Authentication Manager
 * Handles token storage using VS Code's secure storage
 */
export class AuthManager {
  private context: vscode.ExtensionContext;
  private tokenKey = "reqbeamToken";

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Store authentication token
   */
  async storeToken(token: string): Promise<void> {
    try {
      await this.context.secrets.store(this.tokenKey, token);
      console.log("Token stored successfully");
    } catch (error) {
      console.error("Error storing token:", error);
      throw error;
    }
  }

  /**
   * Get stored token
   */
  async getToken(): Promise<string | undefined> {
    return await this.context.secrets.get(this.tokenKey);
  }

  /**
   * Delete stored token
   */
  async deleteToken(): Promise<void> {
    await this.context.secrets.delete(this.tokenKey);
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const result = !!token;
      console.log("isLoggedIn check:", result);
      return result;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }
}

