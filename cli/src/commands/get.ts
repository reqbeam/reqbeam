import chalk from 'chalk';
import { CommandOptions } from '../types.js';
import { makeRequest } from '../utils/request.js';
import { parseHeaders } from '../utils/request.js';
import { loadEnvironment } from '../utils/environment.js';
import { formatResponse, formatError } from '../utils/formatter.js';
import { logHistory, createHistoryEntry } from '../utils/history.js';

export async function getCommand(
  url: string,
  options: CommandOptions
): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(chalk.cyan.bold('\n🚀 Making GET request...\n'));

    // Load environment
    const env = await loadEnvironment(options.env);

    // Parse headers
    const headers = options.header ? parseHeaders(options.header) : {};

    // Make request
    const response = await makeRequest(
      {
        name: 'GET Request',
        method: 'GET',
        url,
        headers,
      },
      env
    );

    const duration = Date.now() - startTime;

    // Log to history (async, don't wait)
    logHistory(createHistoryEntry('GET', url, response.status, duration));

    // Format and display response
    formatResponse(response, options.verbose);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Log error to history
    logHistory(createHistoryEntry('GET', url, undefined, duration, error.message));
    
    formatError(error.message);
    process.exit(1);
  }
}

