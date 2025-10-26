import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AuthManager } from './auth.js';
import chalk from 'chalk';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  requests?: Request[];
}

export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: any;
  body?: string;
  bodyType?: string;
  collectionId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  statusCode?: number;
  response?: string;
  headers?: any;
  duration?: number;
  size?: number;
  error?: string;
  createdAt: string;
}

/**
 * API Client for communicating with the Postmind web UI
 */
export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      timeout: 30000,
    });

    // Add request interceptor to add auth headers
    this.client.interceptors.request.use(async (config) => {
      const authManager = AuthManager.getInstance();
      const authConfig = await authManager.loadConfig();
      
      if (authConfig) {
        config.baseURL = authConfig.apiUrl;
        config.headers.Authorization = `Bearer ${authConfig.token}`;
      }
      
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log(chalk.red('\n❌ Authentication failed or token expired'));
          console.log(chalk.yellow('Please log in again: postmind auth login\n'));
          process.exit(1);
        }
        throw error;
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // ===== Collections =====

  async getCollections(): Promise<Collection[]> {
    const response = await this.client.get('/api/collections');
    return response.data;
  }

  async getCollection(id: string): Promise<Collection> {
    const response = await this.client.get(`/api/collections/${id}`);
    return response.data;
  }

  async createCollection(data: { name: string; description?: string }): Promise<Collection> {
    const response = await this.client.post('/api/collections', data);
    return response.data;
  }

  async updateCollection(id: string, data: { name?: string; description?: string }): Promise<Collection> {
    const response = await this.client.put(`/api/collections/${id}`, data);
    return response.data;
  }

  async deleteCollection(id: string): Promise<void> {
    await this.client.delete(`/api/collections/${id}`);
  }

  // ===== Requests =====

  async getRequests(collectionId?: string): Promise<Request[]> {
    const collections = await this.getCollections();
    
    if (collectionId) {
      const collection = collections.find(c => c.id === collectionId);
      return collection?.requests || [];
    }
    
    // Return all requests from all collections
    const allRequests: Request[] = [];
    collections.forEach(col => {
      if (col.requests) {
        allRequests.push(...col.requests);
      }
    });
    return allRequests;
  }

  async getRequest(id: string): Promise<Request> {
    const allRequests = await this.getRequests();
    const request = allRequests.find(r => r.id === id);
    
    if (!request) {
      throw new Error(`Request with ID ${id} not found`);
    }
    
    return request;
  }

  async createRequest(data: {
    name: string;
    method: string;
    url: string;
    headers?: any;
    body?: string;
    bodyType?: string;
    collectionId?: string;
  }): Promise<Request> {
    const response = await this.client.post('/api/requests', data);
    return response.data;
  }

  async updateRequest(id: string, data: {
    name?: string;
    method?: string;
    url?: string;
    headers?: any;
    body?: string;
    bodyType?: string;
    collectionId?: string;
  }): Promise<Request> {
    const response = await this.client.put(`/api/requests/${id}`, data);
    return response.data;
  }

  async deleteRequest(id: string): Promise<void> {
    await this.client.delete(`/api/requests/${id}`);
  }

  // ===== Environments =====

  async getEnvironments(): Promise<Environment[]> {
    const response = await this.client.get('/api/environments');
    return response.data;
  }

  async getEnvironment(id: string): Promise<Environment> {
    const response = await this.client.get(`/api/environments/${id}`);
    return response.data;
  }

  async createEnvironment(data: {
    name: string;
    variables: Record<string, string>;
  }): Promise<Environment> {
    const response = await this.client.post('/api/environments', data);
    return response.data;
  }

  async updateEnvironment(id: string, data: {
    name?: string;
    variables?: Record<string, string>;
  }): Promise<Environment> {
    const response = await this.client.put(`/api/environments/${id}`, data);
    return response.data;
  }

  async deleteEnvironment(id: string): Promise<void> {
    await this.client.delete(`/api/environments/${id}`);
  }

  async activateEnvironment(id: string): Promise<Environment> {
    const response = await this.client.post(`/api/environments/${id}/activate`);
    return response.data;
  }

  // ===== History =====

  async getHistory(): Promise<RequestHistory[]> {
    const response = await this.client.get('/api/history');
    return response.data;
  }

  async createHistoryEntry(data: {
    requestId: string;
    statusCode?: number;
    response?: string;
    headers?: any;
    duration?: number;
    size?: number;
    error?: string;
  }): Promise<RequestHistory> {
    const response = await this.client.post('/api/history', data);
    return response.data;
  }

  async clearHistory(): Promise<void> {
    await this.client.delete('/api/history');
  }

  // ===== Request Execution =====

  async sendRequest(data: {
    method: string;
    url: string;
    headers?: any;
    body?: string;
    bodyType?: string;
  }): Promise<any> {
    const response = await this.client.post('/api/request/send', data);
    return response.data;
  }

  // ===== History Logging =====

  async saveHistory(data: {
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
    error?: string;
  }): Promise<void> {
    try {
      await this.client.post('/api/history', {
        ...data,
        source: 'CLI'  // Mark this as coming from CLI
      });
    } catch (error: any) {
      // Don't fail the command if history logging fails
      console.error('Warning: Failed to save to history:', error.message);
    }
  }
}

