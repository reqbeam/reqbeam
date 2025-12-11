import * as vscode from "vscode";
import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { AuthManager } from "../auth/authManager";
import { createUser, authenticateUser, generateToken } from "../storage/users";

let loginServer: http.Server | null = null;
let serverPort: number | null = null;
let pendingToken: string | null = null;
let tokenReceivedCallback: ((token: string) => void) | null = null;

/**
 * Handle API requests (login, signup)
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

        const user = await authenticateUser(email, password);
        
        if (!user) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Invalid email or password" }));
          return;
        }

        const token = generateToken(user.id, user.email);
        
        // Store token for VS Code to pick up
        pendingToken = token;
        if (tokenReceivedCallback) {
          tokenReceivedCallback(token);
          tokenReceivedCallback = null;
        }
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, token }));
        return;
      }

      if (url === "/api/signup" && req.method === "POST") {
        const { name, email, password } = JSON.parse(body);
        
        if (!name || !email || !password) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Name, email, and password are required" }));
          return;
        }

        if (password.length < 8) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Password must be at least 8 characters long" }));
          return;
        }

        try {
          const user = await createUser(email, name, password);
          const token = generateToken(user.id, user.email);
          
          // Store token for VS Code to pick up
          pendingToken = token;
          if (tokenReceivedCallback) {
            tokenReceivedCallback(token);
            tokenReceivedCallback = null;
          }
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, token }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: errorMessage }));
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
    // Find available port
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
      const currentPort = serverPort || 0;
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

    // Find available port
    server.listen(0, "127.0.0.1", () => {
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

