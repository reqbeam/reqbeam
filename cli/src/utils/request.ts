import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Request } from '../types.js';

export async function makeRequest(
  request: Request,
  env: Record<string, string> = {}
): Promise<AxiosResponse> {
  try {
    // Replace environment variables in URL
    let url = replaceEnvVariables(request.url, env);

    // Prepare headers
    const headers = { ...request.headers };
    for (const key in headers) {
      headers[key] = replaceEnvVariables(headers[key], env);
    }

    // Prepare request body
    let data = request.body;
    if (data && typeof data === 'string') {
      data = replaceEnvVariables(data, env);
      try {
        data = JSON.parse(data);
      } catch {
        // Keep as string if not valid JSON
      }
    } else if (data && typeof data === 'object') {
      data = JSON.parse(replaceEnvVariables(JSON.stringify(data), env));
    }

    const config: AxiosRequestConfig = {
      method: request.method.toUpperCase(),
      url,
      headers,
      data,
      validateStatus: () => true, // Don't throw on any status code
      timeout: 30000,
    };

    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    // Add response time to response object
    (response as any).responseTime = responseTime;

    return response;
  } catch (error: any) {
    if (error.response) {
      return error.response;
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

export function replaceEnvVariables(
  str: string,
  env: Record<string, string>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return env[key] !== undefined ? env[key] : match;
  });
}

export function parseHeaders(headers: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  
  for (const header of headers) {
    const colonIndex = header.indexOf(':');
    if (colonIndex > 0) {
      const key = header.substring(0, colonIndex).trim();
      const value = header.substring(colonIndex + 1).trim();
      parsed[key] = value;
    }
  }
  
  return parsed;
}

