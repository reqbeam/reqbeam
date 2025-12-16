import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import * as fs from "fs";
import { URL } from "url";
import { AuthManager } from "../auth/authManager";
import { getAuthEndpoint } from "../config/authConfig";

let loginServer: http.Server | null = null;
let serverPort: number | null = null;
let pendingToken: string | null = null;
let tokenReceivedCallback: ((token: string) => void) | null = null;

/**
 * Proxy request to auth server using Node.js http/https
 */
async function proxyToAuthServer(
  endpoint: string,
  body: any
): Promise<{ success: boolean; token?: string; error?: string; message?: string }> {
  return new Promise((resolve) => {
    try {
      const authUrl = getAuthEndpoint(endpoint as any);
      const url = new URL(authUrl);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;

      const postData = JSON.stringify(body);

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = client.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk.toString();
        });

        res.on("end", () => {
          try {
            const responseData = JSON.parse(data);

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && responseData.token) {
              resolve({ success: true, token: responseData.token });
            } else {
              resolve({
                success: false,
                error: responseData.message || responseData.error || "Authentication failed",
              });
            }
          } catch (parseError) {
            resolve({
              success: false,
              error: "Failed to parse auth server response",
            });
          }
        });
      });

      req.on("error", (error) => {
        resolve({
          success: false,
          error: `Failed to connect to auth server: ${error.message}`,
        });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          error: "Request to auth server timed out",
        });
      });

      req.write(postData);
      req.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      resolve({
        success: false,
        error: `Failed to connect to auth server: ${errorMessage}`,
      });
    }
  });
}

/**
 * Handle API requests (login, signup) - proxy to auth server
 */
function handleApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: string
): void {
  let body = "";
  
  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", async () => {
    try {
      if (url === "/api/login" && req.method === "POST") {
        const { email, password } = JSON.parse(body);
        
        if (!email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Email and password are required" }));
          return;
        }

        const result = await proxyToAuthServer("login", { email, password });
        
        if (result.success && result.token) {
          // Store token for VS Code to pick up
          pendingToken = result.token;
          if (tokenReceivedCallback) {
            tokenReceivedCallback(result.token);
            tokenReceivedCallback = null;
          }
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, token: result.token }));
        } else {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: result.error || "Invalid email or password" }));
        }
        return;
      }

      if (url === "/api/signup" && req.method === "POST") {
        const { name, email, password } = JSON.parse(body);
        
        if (!name || !email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Name, email, and password are required" }));
          return;
        }

        const result = await proxyToAuthServer("signup", { name, email, password });
        
        if (result.success && result.token) {
          // Store token for VS Code to pick up
          pendingToken = result.token;
          if (tokenReceivedCallback) {
            tokenReceivedCallback(result.token);
            tokenReceivedCallback = null;
          }
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, token: result.token }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: result.error || "Signup failed" }));
        }
        return;
      }

      // Google OAuth endpoints
      if (url === "/api/google-oauth" && req.method === "POST") {
        const { idToken, email, name } = JSON.parse(body);
        
        if (!email) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Email is required" }));
          return;
        }

        // Decode Google ID token to get user info
        // For OAuth, we'll use the oauth/login endpoint which handles find-or-create
        const result = await proxyToAuthServer("oauthLogin", {
          email,
          name: name || email.split("@")[0],
          provider: "google",
        });
        
        if (result.success && result.token) {
          // Store token for VS Code to pick up
          pendingToken = result.token;
          if (tokenReceivedCallback) {
            tokenReceivedCallback(result.token);
            tokenReceivedCallback = null;
          }
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, token: result.token }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: result.error || "Google sign-in failed" }));
        }
        return;
      }

      // Endpoint for VS Code to poll for token
      if (url === "/api/token" && req.method === "GET") {
        if (pendingToken) {
          const token = pendingToken;
          pendingToken = null; // Clear after reading
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, token }));
        } else {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, token: null }));
        }
        return;
      }

      // 404 for unknown API routes
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: "Not Found" }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      }));
    }
  });
}

/**
 * Start local HTTP server to serve login page
 */
function startLoginServer(context: vscode.ExtensionContext): Promise<number> {
  return new Promise((resolve, reject) => {
    // Always use fixed port 5000 for the login page
    const FIXED_PORT = 5000;
    const server = http.createServer((req, res) => {
      const url = req.url || "/";
      
      // CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Get current port (will be set after server starts)
      const currentPort = serverPort || FIXED_PORT;
      const serverUrl = `http://localhost:${currentPort}`;

      // Handle API routes
      if (url.startsWith("/api/")) {
        handleApiRequest(req, res, url);
        return;
      }

      // Serve login.html
      if (url === "/" || url === "/login.html") {
        const loginHtmlPath = path.join(context.extensionPath, "media", "login.html");
        const loginCssPath = path.join(context.extensionPath, "media", "login.css");
        const loginJsPath = path.join(context.extensionPath, "media", "login.js");

        try {
          let html = fs.readFileSync(loginHtmlPath, "utf8");
          
          // Inject API base URL and CSS/JS
          html = html.replace(/{{API_BASE_URL}}/g, serverUrl);
          
          // Inject auth server URL for direct API calls (optional, for Google OAuth)
          const authServerUrl = getAuthEndpoint("health").replace("/health", "");
          html = html.replace(/{{AUTH_SERVER_URL}}/g, authServerUrl);
          
          // Inject CSS inline
          if (fs.existsSync(loginCssPath)) {
            const css = fs.readFileSync(loginCssPath, "utf8");
            html = html.replace("<!-- INJECT_CSS -->", `<style>${css}</style>`);
          }
          
          // Inject JS inline
          if (fs.existsSync(loginJsPath)) {
            let js = fs.readFileSync(loginJsPath, "utf8");
            // Replace API_BASE_URL placeholder in JS with localhost URL
            js = js.replace(/{{API_BASE_URL}}/g, serverUrl);
            html = html.replace("<!-- INJECT_JS -->", `<script>${js}</script>`);
          }

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(html);
        } catch (error) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Error loading login page: ${error instanceof Error ? error.message : String(error)}`);
        }
        return;
      }

      // Serve login.css
      if (url === "/login.css") {
        const cssPath = path.join(context.extensionPath, "media", "login.css");
        try {
          const css = fs.readFileSync(cssPath, "utf8");
          res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
          res.end(css);
        } catch (error) {
          res.writeHead(404);
          res.end();
        }
        return;
      }

      // Serve login.js
      if (url === "/login.js") {
        const jsPath = path.join(context.extensionPath, "media", "login.js");
        try {
          let js = fs.readFileSync(jsPath, "utf8");
          // Inject API base URL into JS (use localhost)
          js = js.replace(/{{API_BASE_URL}}/g, serverUrl);
          res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
          res.end(js);
        } catch (error) {
          res.writeHead(404);
          res.end();
        }
        return;
      }

      // 404 for other routes
      res.writeHead(404);
      res.end("Not Found");
    });

    // Start server on fixed port
    server.listen(FIXED_PORT, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        loginServer = server;
        serverPort = port;
        resolve(port);
      } else {
        reject(new Error("Failed to get server port"));
      }
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Stop login server
 */
export function stopLoginServer(): void {
  if (loginServer) {
    loginServer.close();
    loginServer = null;
    serverPort = null;
  }
}

/**
 * Poll for token from login server
 */
async function pollForToken(port: number, authManager: AuthManager, onStatusUpdate: () => void): Promise<void> {
  const maxAttempts = 60; // Poll for up to 60 seconds
  let attempts = 0;

  const poll = async (): Promise<void> => {
    if (attempts >= maxAttempts) {
      return;
    }

    try {
      const response = await new Promise<{ success: boolean; token: string | null }>((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/api/token`, (res: any) => {
          let data = "";
          res.on("data", (chunk: string) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ success: false, token: null });
            }
          });
        });
        req.on("error", reject);
        req.setTimeout(2000, () => {
          req.destroy();
          resolve({ success: false, token: null });
        });
      });

      if (response.success && response.token) {
        await authManager.storeToken(response.token);
        vscode.window.showInformationMessage("Successfully logged in to ReqBeam!");
        onStatusUpdate();
        return;
      }

      // Continue polling
      attempts++;
      setTimeout(poll, 1000); // Poll every second
    } catch (error) {
      // Continue polling on error
      attempts++;
      setTimeout(poll, 1000);
    }
  };

  poll();
}

/**
 * Register login command
 */
export function registerLoginCommand(
  context: vscode.ExtensionContext,
  authManager: AuthManager,
  onStatusUpdate?: () => void
): void {
  const disposable = vscode.commands.registerCommand("reqbeam.auth.login", async () => {
    // Check if already logged in
    const isLoggedIn = await authManager.isLoggedIn();
    if (isLoggedIn) {
      const result = await vscode.window.showInformationMessage(
        "You are already logged in. Do you want to logout?",
        "Logout",
        "Cancel"
      );
      if (result === "Logout") {
        await vscode.commands.executeCommand("reqbeam.auth.logout");
      }
      return;
    }

    try {
      // Ensure any previous login server instance is stopped before starting a new one
      stopLoginServer();

      // Clear any pending token
      pendingToken = null;
      
      // Start local server
      const port = await startLoginServer(context);
      
      // Set up callback for immediate token handling
      tokenReceivedCallback = async (token: string) => {
        await authManager.storeToken(token);
        vscode.window.showInformationMessage("Successfully logged in to ReqBeam!");
        if (onStatusUpdate) {
          await onStatusUpdate();
        } else {
          await vscode.commands.executeCommand("reqbeam.auth.statusUpdate");
        }
        // Refresh all services to show only current user's data
        await vscode.commands.executeCommand("reqbeam.refreshAll");
      };
      
      // Start polling as backup
      if (onStatusUpdate) {
        pollForToken(port, authManager, onStatusUpdate);
      }
      
      // Open browser to login page
      const loginUrl = `http://localhost:${port}/login.html`;
      await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
      
      vscode.window.showInformationMessage("Login page opened in your browser. Please complete login in the browser.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      vscode.window.showErrorMessage(`Failed to start login server: ${errorMessage}`);
    }
  });

  context.subscriptions.push(disposable);
  
  // Cleanup server on deactivate
  context.subscriptions.push({
    dispose: () => {
      stopLoginServer();
      pendingToken = null;
      tokenReceivedCallback = null;
    },
  });
}

