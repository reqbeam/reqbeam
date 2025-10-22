export interface Project {
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  name: string;
  variables: Record<string, string>;
  isActive?: boolean;
}

export interface Request {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  body?: string | object;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  name: string;
  description?: string;
  requests: string[]; // Array of request names
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  type: 'request' | 'collection';
  name: string;
  timestamp: string;
  duration: number;
  status: number;
  success: boolean;
  environment?: string;
  response?: any;
}

export interface ExecutionResult {
  name: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  success: boolean;
  response?: any;
  error?: string;
}

export interface ProjectConfig {
  name: string;
  currentEnvironment?: string;
  environments: Environment[];
  requests: Request[];
  collections: Collection[];
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RunOptions {
  parallel?: boolean;
  saveResponse?: boolean;
  env?: string;
  verbose?: boolean;
}
