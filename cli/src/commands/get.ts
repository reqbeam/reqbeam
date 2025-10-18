import chalk from 'chalk';
import { CommandOptions } from '../types.js';
import { makeRequest } from '../utils/request.js';
import { parseHeaders } from '../utils/request.js';
import { loadEnvironment } from '../utils/environment.js';
import { formatResponse, formatError } from '../utils/formatter.js';

export async function getCommand(
  url: string,
  options: CommandOptions
): Promise<void> {
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

    // Format and display response
    formatResponse(response, options.verbose);

  } catch (error: any) {
    formatError(error.message);
    process.exit(1);
  }
}

