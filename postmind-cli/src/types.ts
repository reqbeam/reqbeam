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

// Testing & Automation Types
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  assertions: TestAssertion[];
}

export interface TestAssertion {
  description: string;
  passed: boolean;
  expected?: any;
  actual?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  timestamp: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  command: string;
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
}

// Logging & Monitoring Types
export interface LogEntry {
  id: string;
  type: 'request' | 'test' | 'collection';
  name: string;
  status: string;
  duration: number;
  timestamp: string;
  details?: any;
  environment?: string;
  success: boolean;
}

export interface LogSummary {
  total: number;
  passed: number;
  failed: number;
  averageDuration: number;
  lastRun?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  filePath: string;
  startDate?: string;
  endDate?: string;
  type?: 'request' | 'test' | 'collection' | 'all';
}