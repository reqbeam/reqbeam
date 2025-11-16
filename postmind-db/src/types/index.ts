/**
 * Shared TypeScript types for Postmind database operations
 */

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  workspaceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  requests?: Request[];
}

export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: string | null;
  body?: string | null;
  bodyType?: string | null;
  auth?: string | null;
  collectionId?: string | null;
  userId: string;
  workspaceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>; // Parsed from JSON string
  userId: string;
  workspaceId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    name: string | null;
    email: string;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  _count?: {
    collections: number;
    requests: number;
    environments: number;
  };
}

export interface ApiHistory {
  id: string;
  method: string;
  url: string;
  statusCode?: number | null;
  source: 'CLI' | 'WEB';
  duration?: number | null;
  error?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  createdAt: Date;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  workspaceId?: string | null;
  statusCode?: number | null;
  response?: string | null;
  headers?: string | null;
  duration?: number | null;
  size?: number | null;
  error?: string | null;
  createdAt: Date;
}

export interface MockServer {
  id: string;
  name: string;
  baseUrl?: string | null;
  collectionId?: string | null;
  userId: string;
  workspaceId?: string | null;
  isRunning: boolean;
  responseDelay: number;
  defaultStatusCode: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockEndpoint {
  id: string;
  mockServerId: string;
  method: string;
  path: string;
  response?: string | null;
  statusCode: number;
  headers?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  password?: string | null;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating/updating entities
export interface CreateCollectionInput {
  name: string;
  description?: string;
  workspaceId?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
}

export interface CreateRequestInput {
  name: string;
  method: string;
  url: string;
  headers?: any;
  body?: string;
  bodyType?: string;
  auth?: any;
  collectionId?: string;
  workspaceId?: string;
}

export interface UpdateRequestInput {
  name?: string;
  method?: string;
  url?: string;
  headers?: any;
  body?: string;
  bodyType?: string;
  auth?: any;
  collectionId?: string;
}

export interface CreateEnvironmentInput {
  name: string;
  variables: Record<string, string>;
  workspaceId?: string;
}

export interface UpdateEnvironmentInput {
  name?: string;
  variables?: Record<string, string>;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export interface CreateApiHistoryInput {
  method: string;
  url: string;
  statusCode?: number;
  source: 'CLI' | 'WEB';
  duration?: number;
  error?: string;
  workspaceId?: string;
}

export interface CreateRequestHistoryInput {
  requestId: string;
  statusCode?: number;
  response?: string;
  headers?: any;
  duration?: number;
  size?: number;
  error?: string;
  workspaceId?: string;
}

// Query options
export interface QueryOptions {
  workspaceId?: string;
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface HistoryQueryOptions extends QueryOptions {
  source?: 'CLI' | 'WEB';
}

