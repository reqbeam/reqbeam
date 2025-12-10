export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface Workspace {
  id: number;
  name: string;
  description?: string;
}

export interface Collection {
  id: number;
  name: string;
  workspaceId: number | null;
  description?: string;
}

export interface RequestModel {
  id: number;
  collectionId: number | null;
  workspaceId: number | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers: string; // JSON-encoded array of { key, value, enabled }
  body: string; // raw string
  bodyType?: string; // json, form-data, x-www-form-urlencoded
  auth?: string; // JSON-encoded auth config (deprecated, use request_auth table)
}

export interface RequestParam {
  id: number;
  requestId: number;
  key: string;
  value: string;
  active: boolean;
}

export type AuthType = "none" | "apikey" | "bearer" | "basic" | "header";

export interface RequestAuth {
  id: number;
  requestId: number;
  type: AuthType;
  key?: string; // For API Key
  value?: string; // For API Key value or Bearer token
  username?: string; // For Basic Auth
  password?: string; // For Basic Auth (base64 encoded)
  in_location?: "header" | "query"; // For API Key location
  headerName?: string; // For Custom Header Auth
  headerValue?: string; // For Custom Header Auth
}

export interface Environment {
  id: number;
  name: string;
  variables: string; // JSON-encoded { key: value }
  workspaceId: number | null;
  isActive?: boolean;
}

export interface HistoryEntry {
  id: number;
  method: string;
  url: string;
  status: number;
  duration: number;
  createdAt: string;
  workspaceId?: number | null;
}

export interface SendRequestPayload {
  id?: number;
  collectionId?: number | null;
  workspaceId?: number | null;
  name?: string;
  method: HttpMethod;
  url: string;
  headers: { key: string; value: string; enabled?: boolean }[];
  body: string;
  bodyType?: string;
  auth?: string;
  params?: RequestParam[]; // Query parameters
  authConfig?: RequestAuth; // Authorization config
}

export interface SendRequestResult {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
  json?: unknown;
  duration: number;
  size: number;
}
