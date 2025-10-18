import chalk from 'chalk';
import { CommandOptions } from '../types.js';
import { makeRequest } from '../utils/request.js';
import { parseHeaders } from '../utils/request.js';
import { loadEnvironment } from '../utils/environment.js';
import { formatResponse, formatError } from '../utils/formatter.js';

export async function postCommand(
  url: string,
  options: CommandOptions
): Promise<void> {
  try {
    console.log(chalk.cyan.bold('\n🚀 Making POST request...\n'));

    // Load environment
    const env = await loadEnvironment(options.env);

    // Parse headers
    const headers = options.header ? parseHeaders(options.header) : {};

    // Parse body data
    let body;
    if (options.data) {
      try {
        body = JSON.parse(options.data);
      } catch (error) {
        formatError('Invalid JSON in request body');
        process.exit(1);
      }
    }

    // Make request
    const response = await makeRequest(
      {
        name: 'POST Request',
        method: 'POST',
        url,
        headers,
        body,
      },
      env
    );

    // Format and display response
    formatResponse(response, options.verbose);

  } catch (error: any) {
    formatError(error.message);
    process.exit(1);
  }
}

