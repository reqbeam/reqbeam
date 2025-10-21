import chalk from 'chalk';
import { CommandOptions, TestResult, AssertionResult } from '../types.js';
import { loadCollection, validateCollection } from '../utils/collection.js';
import { loadEnvironment } from '../utils/environment.js';
import { makeRequest } from '../utils/request.js';
import { runAssertions } from '../utils/assertions.js';
import { formatError, formatSuccess, formatTestResultsTable } from '../utils/formatter.js';
import { generateHtmlReport } from '../utils/report.js';
import { logHistory, createHistoryEntry } from '../utils/history.js';

export async function testCommand(
  collectionPath: string,
  options: CommandOptions
): Promise<void> {
  try {
    console.log(chalk.cyan.bold('\n🧪 Running tests...\n'));

    // Load collection
    const collection = await loadCollection(collectionPath);
    validateCollection(collection);

    console.log(chalk.bold('Collection:'), collection.name);
    if (collection.description) {
      console.log(chalk.gray(collection.description));
    }
    console.log(chalk.gray(`Running ${collection.requests.length} tests...\n`));

    // Load environment
    const env = await loadEnvironment(options.env);

    // Run all tests
    const results: TestResult[] = [];

    for (let i = 0; i < collection.requests.length; i++) {
      const request = collection.requests[i];
      
      console.log(chalk.cyan(`[${i + 1}/${collection.requests.length}]`), request.name);

      try {
        const response = await makeRequest(request, env);
        const responseTime = (response as any).responseTime || 0;

        // Log to history (async, don't wait)
        logHistory(createHistoryEntry(
          request.method,
          request.url,
          response.status,
          responseTime
        ));

        // Run assertions if they exist
        let assertions: AssertionResult[] = [];
        if (request.expect) {
          assertions = runAssertions(response, request.expect, responseTime);
        }

        const allAssertionsPassed = assertions.length === 0 || assertions.every(a => a.passed);
        const statusOk = response.status >= 200 && response.status < 400;
        const passed = statusOk && allAssertionsPassed;

        results.push({
          name: request.name,
          method: request.method,
          url: request.url,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          passed,
          assertions,
        });

        // Display inline result
        const icon = passed ? chalk.green('✓') : chalk.red('✗');
        const statusColor = response.status >= 200 && response.status < 300
          ? chalk.green
          : response.status >= 400
          ? chalk.red
          : chalk.yellow;

        console.log(
          '  ',
          icon,
          statusColor(`${response.status} ${response.statusText}`),
          chalk.gray(`- ${responseTime}ms`)
        );

        // Show failed assertions
        if (!allAssertionsPassed) {
          const failedAssertions = assertions.filter(a => !a.passed);
          for (const assertion of failedAssertions) {
            console.log(chalk.red('    ✗'), assertion.name);
            if (assertion.expected !== undefined) {
              console.log(chalk.gray('      Expected:'), chalk.yellow(JSON.stringify(assertion.expected)));
              console.log(chalk.gray('      Actual:'), chalk.red(JSON.stringify(assertion.actual)));
            }
          }
        }

      } catch (error: any) {
        // Log error to history
        logHistory(createHistoryEntry(
          request.method,
          request.url,
          undefined,
          0,
          error.message
        ));

        results.push({
          name: request.name,
          method: request.method,
          url: request.url,
          status: 0,
          statusText: 'Error',
          responseTime: 0,
          passed: false,
          assertions: [],
          error: error.message,
        });

        console.log('  ', chalk.red('✗ Error:'), error.message);
      }

      console.log();
    }

    // Display results table
    formatTestResultsTable(results);

    // Generate HTML report if requested
    if (options.report) {
      await generateHtmlReport(results, options.report, collection.name);
      formatSuccess(`HTML report generated: ${options.report}`);
    }

    // Exit with error code if any test failed
    const failed = results.filter(r => !r.passed).length;
    if (failed > 0) {
      process.exit(1);
    }

  } catch (error: any) {
    formatError(error.message);
    process.exit(1);
  }
}

