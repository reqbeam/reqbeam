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
  auth?: string; // JSON-encoded auth config
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
}

export interface SendRequestResult {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
  json?: unknown;
  duration: number;
  size: number;
}


