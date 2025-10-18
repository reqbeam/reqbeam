import chalk from 'chalk';
import { AxiosResponse } from 'axios';
import { TestResult, AssertionResult } from '../types.js';
import { table } from 'table';

export function formatResponse(response: AxiosResponse, verbose: boolean = false) {
  console.log('\n' + chalk.bold.cyan('Response:'));
  console.log(chalk.gray('─'.repeat(60)));
  
  // Status
  const statusColor = response.status >= 200 && response.status < 300
    ? chalk.green
    : response.status >= 400
    ? chalk.red
    : chalk.yellow;
  
  console.log(chalk.bold('Status:'), statusColor(`${response.status} ${response.statusText}`));
  
  // Response time
  const responseTime = (response as any).responseTime || 0;
  const timeColor = responseTime < 500 ? chalk.green : responseTime < 2000 ? chalk.yellow : chalk.red;
  console.log(chalk.bold('Time:'), timeColor(`${responseTime}ms`));
  
  // Headers
  if (verbose) {
    console.log(chalk.bold('\nHeaders:'));
    for (const [key, value] of Object.entries(response.headers)) {
      console.log(chalk.gray(`  ${key}:`), value);
    }
  }
  
  // Body
  console.log(chalk.bold('\nBody:'));
  try {
    const formatted = typeof response.data === 'object'
      ? JSON.stringify(response.data, null, 2)
      : response.data;
    console.log(formatted);
  } catch {
    console.log(response.data);
  }
  
  console.log(chalk.gray('─'.repeat(60)) + '\n');
}

export function formatTestResults(results: TestResult[]) {
  console.log('\n' + chalk.bold.cyan('Test Results:'));
  console.log(chalk.gray('═'.repeat(80)) + '\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  for (const result of results) {
    const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
    const methodColor = getMethodColor(result.method);
    
    console.log(
      icon,
      methodColor(result.method.padEnd(6)),
      chalk.white(result.name)
    );
    console.log(chalk.gray(`  ${result.url}`));
    
    if (result.error) {
      console.log(chalk.red(`  Error: ${result.error}`));
    } else {
      const statusColor = result.status >= 200 && result.status < 300
        ? chalk.green
        : chalk.red;
      console.log(
        chalk.gray('  Status:'),
        statusColor(`${result.status} ${result.statusText}`),
        chalk.gray('|'),
        chalk.gray('Time:'),
        formatTime(result.responseTime)
      );
      
      // Show assertions
      if (result.assertions.length > 0) {
        console.log(chalk.gray('  Assertions:'));
        for (const assertion of result.assertions) {
          const assertIcon = assertion.passed ? chalk.green('  ✓') : chalk.red('  ✗');
          console.log(assertIcon, assertion.name);
          if (!assertion.passed && assertion.expected !== undefined) {
            console.log(chalk.gray('    Expected:'), chalk.yellow(JSON.stringify(assertion.expected)));
            console.log(chalk.gray('    Actual:'), chalk.red(JSON.stringify(assertion.actual)));
          }
        }
      }
    }
    
    console.log();
  }

  console.log(chalk.gray('═'.repeat(80)));
  
  // Summary
  console.log(chalk.bold('\nSummary:'));
  console.log(
    chalk.green(`  ✓ Passed: ${passed}`),
    chalk.gray('|'),
    failed > 0 ? chalk.red(`✗ Failed: ${failed}`) : chalk.gray(`✗ Failed: ${failed}`)
  );
  
  const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
  console.log(chalk.gray(`  Total time: ${totalTime}ms`));
  console.log();
}

export function formatTestResultsTable(results: TestResult[]) {
  const data = [
    [
      chalk.bold('Status'),
      chalk.bold('Method'),
      chalk.bold('Name'),
      chalk.bold('Status Code'),
      chalk.bold('Time'),
      chalk.bold('Assertions')
    ],
  ];

  for (const result of results) {
    const icon = result.passed ? chalk.green('✓') : chalk.red('✗');
    const methodColor = getMethodColor(result.method);
    const statusColor = result.status >= 200 && result.status < 300
      ? chalk.green
      : chalk.red;
    
    const assertionsPassed = result.assertions.filter(a => a.passed).length;
    const assertionsTotal = result.assertions.length;
    const assertionText = assertionsTotal > 0
      ? `${assertionsPassed}/${assertionsTotal}`
      : '-';
    
    data.push([
      icon,
      methodColor(result.method),
      result.name,
      result.error ? chalk.red('Error') : statusColor(result.status.toString()),
      formatTime(result.responseTime),
      assertionText
    ]);
  }

  console.log('\n' + table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    }
  }));

  // Summary
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);

  console.log(chalk.bold('Summary:'));
  console.log(
    chalk.green(`  ✓ Passed: ${passed}`),
    chalk.gray('|'),
    failed > 0 ? chalk.red(`✗ Failed: ${failed}`) : chalk.gray(`✗ Failed: ${failed}`),
    chalk.gray('|'),
    chalk.gray(`Total time: ${totalTime}ms`)
  );
  console.log();
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return chalk.green;
    case 'POST':
      return chalk.yellow;
    case 'PUT':
      return chalk.blue;
    case 'DELETE':
      return chalk.red;
    case 'PATCH':
      return chalk.magenta;
    default:
      return chalk.white;
  }
}

function formatTime(ms: number): string {
  const color = ms < 500 ? chalk.green : ms < 2000 ? chalk.yellow : chalk.red;
  return color(`${ms}ms`);
}

export function formatError(message: string) {
  console.error(chalk.red.bold('Error:'), chalk.red(message));
}

export function formatSuccess(message: string) {
  console.log(chalk.green.bold('Success:'), chalk.green(message));
}

export function formatWarning(message: string) {
  console.log(chalk.yellow.bold('Warning:'), chalk.yellow(message));
}

export function formatInfo(message: string) {
  console.log(chalk.cyan.bold('Info:'), chalk.cyan(message));
}

