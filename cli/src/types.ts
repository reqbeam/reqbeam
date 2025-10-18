export interface Request {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  bodyType?: 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
  expect?: Assertion;
  tests?: TestScript[];
}

export interface Collection {
  name: string;
  description?: string;
  requests: Request[];
}

export interface Assertion {
  status?: number;
  statusRange?: [number, number];
  contains?: string | string[];
  notContains?: string | string[];
  headers?: Record<string, string>;
  jsonPath?: Record<string, any>;
  responseTime?: number; // max response time in ms
}

export interface TestScript {
  name: string;
  script: string;
}

export interface TestResult {
  name: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  responseTime: number;
  passed: boolean;
  assertions: AssertionResult[];
  error?: string;
}

export interface AssertionResult {
  name: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  message?: string;
}

export interface CommandOptions {
  header?: string[];
  data?: string;
  env?: string;
  verbose?: boolean;
  report?: string;
}

export interface Environment {
  [key: string]: string;
}

