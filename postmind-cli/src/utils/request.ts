import axios, { AxiosResponse } from 'axios';
import { Request, ExecutionResult, Environment } from '../types.js';

export class RequestExecutor {
  public static async executeRequest(
    request: Request,
    environment?: Environment,
    verbose: boolean = false
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Replace environment variables in URL and headers
      const processedRequest = this.processRequestWithEnvironment(request, environment);
      
      // Filter out empty or invalid headers
      const cleanHeaders = processedRequest.headers ? 
        Object.fromEntries(
          Object.entries(processedRequest.headers).filter(([key, value]) => 
            key && key.trim() !== '' && value !== undefined && value !== null
          )
        ) : undefined;

      const response: AxiosResponse = await axios({
        method: processedRequest.method,
        url: processedRequest.url,
        headers: cleanHeaders,
        data: processedRequest.body,
        timeout: 30000,
        validateStatus: () => true // Don't throw on any status code
      });

      const duration = Date.now() - startTime;

      return {
        name: request.name,
        method: request.method,
        url: processedRequest.url,
        status: response.status,
        duration,
        success: response.status >= 200 && response.status < 300,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        }
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        name: request.name,
        method: request.method,
        url: request.url,
        status: 0,
        duration,
        success: false,
        error: error.message
      };
    }
  }

  private static processRequestWithEnvironment(
    request: Request,
    environment?: Environment
  ): Request {
    if (!environment) {
      return request;
    }

    const processedRequest = { ...request };
    
    // Replace variables in URL
    processedRequest.url = this.replaceVariables(request.url, environment.variables);
    
    // Replace variables in headers
    if (processedRequest.headers) {
      const processedHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(processedRequest.headers)) {
        if (key && key.trim() !== '' && value !== undefined && value !== null) {
          processedHeaders[key] = this.replaceVariables(value, environment.variables);
        }
      }
      processedRequest.headers = Object.keys(processedHeaders).length > 0 ? processedHeaders : undefined;
    }
    
    // Replace variables in body
    if (typeof processedRequest.body === 'string') {
      processedRequest.body = this.replaceVariables(processedRequest.body, environment.variables);
    }

    return processedRequest;
  }

  private static replaceVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] || match;
    });
  }
}
