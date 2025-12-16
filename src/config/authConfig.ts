import * as vscode from "vscode";

/**
 * Authentication Server Configuration
 * Configure the auth server URL via VS Code settings or environment variable
 */
export function getAuthServerBaseUrl(): string {
  // Try to get from VS Code configuration first
  const config = vscode.workspace.getConfiguration("reqbeam");
  const configUrl = config.get<string>("authServerUrl");
  
  if (configUrl) {
    return configUrl;
  }
  
  // Fall back to environment variable
  if (process.env.AUTH_SERVER_URL) {
    return process.env.AUTH_SERVER_URL;
  }
  
  // Default to production auth server
  return "https://api.reqbeam.dev";
}

export const AUTH_SERVER_ENDPOINTS = {
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  oauthLogin: "/api/auth/oauth/login",
  oauthSignup: "/api/auth/oauth/signup",
  verify: "/api/auth/verify",
  health: "/health",
} as const;

/**
 * Get full URL for an auth endpoint
 */
export function getAuthEndpoint(endpoint: keyof typeof AUTH_SERVER_ENDPOINTS): string {
  const baseUrl = getAuthServerBaseUrl();
  return `${baseUrl}${AUTH_SERVER_ENDPOINTS[endpoint]}`;
}

