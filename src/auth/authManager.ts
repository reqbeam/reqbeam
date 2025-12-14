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
   * Store authentication token and sync user to local database
   */
  async storeToken(token: string): Promise<void> {
    try {
      await this.context.secrets.store(this.tokenKey, token);
      console.log("Token stored successfully");
      
      // Sync user to local database after storing token
      await this.syncUserFromToken(token);
    } catch (error) {
      console.error("Error storing token:", error);
      throw error;
    }
  }

  /**
   * Sync user from auth token to local database
   * This ensures the user exists in the local database for foreign key constraints
   */
  private async syncUserFromToken(token: string): Promise<void> {
    try {
      const userInfo = await this.getUserInfo();
      if (!userInfo) {
        console.warn("Could not extract user info from token for syncing");
        return;
      }

      // Import here to avoid circular dependencies
      const { createOrUpdateUserFromAuth } = await import("../storage/users");
      await createOrUpdateUserFromAuth(
        userInfo.userId,
        userInfo.email,
        userInfo.name || undefined
      );
      console.log("User synced to local database:", userInfo.email);
    } catch (error) {
      console.error("Error syncing user to local database:", error);
      // Don't throw - token storage should still succeed even if sync fails
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

  /**
   * Get user info from token (if token contains user data)
   * Returns null if token is invalid or doesn't contain user info
   */
  async getUserInfo(): Promise<{ userId: string; email: string; name?: string } | null> {
    try {
      const token = await this.getToken();
      if (!token) {
        return null;
      }

      // Decode JWT token (simple base64 decode, no verification)
      // In production, you should verify the token signature
      try {
        const parts = token.split(".");
        if (parts.length !== 3) {
          return null;
        }

        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
        return {
          userId: payload.userId || payload.id,
          email: payload.email,
          name: payload.name,
        };
      } catch {
        return null;
      }
    } catch (error) {
      console.error("Error getting user info:", error);
      return null;
    }
  }

  /**
   * Verify token with auth server
   */
  async verifyToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Import here to avoid circular dependencies
      const { getAuthEndpoint } = await import("../config/authConfig");
      const authUrl = getAuthEndpoint("verify");
      const url = new URL(authUrl);
      const isHttps = url.protocol === "https:";
      const http = await import(isHttps ? "https" : "http");

      return new Promise((resolve) => {
        const options: any = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname,
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const req = http.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk.toString();
          });
          res.on("end", () => {
            try {
              const responseData = JSON.parse(data);
              resolve(res.statusCode === 200 && responseData.valid === true);
            } catch {
              resolve(false);
            }
          });
        });

        req.on("error", () => {
          resolve(false);
        });

        req.setTimeout(5000, () => {
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    } catch (error) {
      console.error("Error verifying token:", error);
      return false;
    }
  }
}

