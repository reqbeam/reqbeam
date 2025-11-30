import chalk from 'chalk';
import { table } from 'table';
import { ExecutionResult, Project, Environment, Request, Collection, HistoryEntry } from '../types.js';

export class Formatter {
  public static formatExecutionResult(result: ExecutionResult): string {
    const statusColor = result.success ? chalk.green : chalk.red;
    const methodColor = this.getMethodColor(result.method);
    
    let output = '';
    output += `${methodColor(result.method.padEnd(6))} ${statusColor(result.status.toString().padEnd(3))} `;
    output += `${chalk.blue(result.duration + 'ms')} ${result.name}\n`;
    
    if (!result.success && result.error) {
      output += `  ${chalk.red('Error:')} ${result.error}\n`;
    }
    
    // Display response if available
    if (result.response) {
      output += `\n${chalk.bold('Response:')}\n`;
      
      // Show status text
      if (result.response.statusText) {
        output += `  ${chalk.gray('Status:')} ${result.response.status} ${result.response.statusText}\n`;
      }
      
      // Show headers if available
      if (result.response.headers && Object.keys(result.response.headers).length > 0) {
        output += `  ${chalk.gray('Headers:')}\n`;
        const relevantHeaders = ['content-type', 'content-length', 'server', 'date'];
        for (const key of relevantHeaders) {
          const headerKey = Object.keys(result.response.headers).find(
            k => k.toLowerCase() === key.toLowerCase()
          );
          if (headerKey && result.response.headers[headerKey]) {
            output += `    ${chalk.cyan(key)}: ${result.response.headers[headerKey]}\n`;
          }
        }
      }
      
      // Show response data
      if (result.response.data !== undefined) {
        output += `  ${chalk.gray('Body:')}\n`;
        try {
          const dataString = typeof result.response.data === 'string' 
            ? result.response.data 
            : JSON.stringify(result.response.data, null, 2);
          
          // Show full response without truncation
          const truncated = dataString;
          
          // Split into lines and add indentation
          const lines = truncated.split('\n');
          for (const line of lines) {
            output += `    ${line}\n`;
          }
        } catch (e) {
          output += `    ${chalk.yellow('Unable to format response data')}\n`;
        }
      }
      output += '\n';
    }
    
    return output;
  }

  public static formatExecutionResults(results: ExecutionResult[]): string {
    if (results.length === 0) {
      return chalk.yellow('No results to display');
    }

    const data = results.map(result => [
      result.success ? chalk.green('✓') : chalk.red('✗'),
      this.getMethodColor(result.method)(result.method),
      result.name,
      this.getStatusColor(result.status)(result.status.toString()),
      chalk.blue(result.duration + 'ms')
    ]);

    const tableConfig = {
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
      },
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1
      }
    };

    return table([
      ['Status', 'Method', 'Name', 'Status Code', 'Time'],
      ...data
    ], tableConfig);
  }

  public static formatProjects(projects: Project[]): string {
    if (projects.length === 0) {
      return chalk.yellow('No projects found');
    }

    const data = projects.map(project => [
      project.name,
      new Date(project.createdAt).toLocaleDateString(),
      new Date(project.updatedAt).toLocaleDateString()
    ]);

    return table([
      ['Name', 'Created', 'Updated'],
      ...data
    ]);
  }

  public static formatEnvironments(environments: Environment[]): string {
    if (environments.length === 0) {
      return chalk.yellow('No environments found');
    }

    const data = environments.map(env => [
      env.isActive ? chalk.green('●') : '○',
      env.name,
      Object.keys(env.variables).length + ' variables'
    ]);

    return table([
      ['Active', 'Name', 'Variables'],
      ...data
    ]);
  }

  public static formatRequests(requests: Request[]): string {
    if (requests.length === 0) {
      return chalk.yellow('No requests found');
    }

    const data = requests.map(req => [
      this.getMethodColor(req.method)(req.method),
      req.name,
      req.url,
      new Date(req.updatedAt).toLocaleDateString()
    ]);

    return table([
      ['Method', 'Name', 'URL', 'Updated'],
      ...data
    ]);
  }

  public static formatCollections(collections: Collection[]): string {
    if (collections.length === 0) {
      return chalk.yellow('No collections found');
    }

    const data = collections.map(col => [
      col.name,
      col.requests.length + ' requests',
      new Date(col.updatedAt).toLocaleDateString()
    ]);

    return table([
      ['Name', 'Requests', 'Updated'],
      ...data
    ]);
  }

  public static formatHistory(history: HistoryEntry[]): string {
    if (history.length === 0) {
      return chalk.yellow('No history found');
    }

    const data = history.slice(0, 10).map(entry => [
      entry.id.substring(0, 8),
      entry.type,
      entry.name,
      entry.success ? chalk.green('✓') : chalk.red('✗'),
      entry.status.toString(),
      entry.duration + 'ms',
      new Date(entry.timestamp).toLocaleString()
    ]);

    return table([
      ['ID', 'Type', 'Name', 'Status', 'Code', 'Time', 'Date'],
      ...data
    ]);
  }

  public static formatSummary(results: ExecutionResult[]): string {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    let output = '\n';
    output += chalk.bold('Summary:\n');
    output += `  ${chalk.green('✓ Passed:')} ${passed} | `;
    output += `${chalk.red('✗ Failed:')} ${failed} | `;
    output += `${chalk.blue('Total time:')} ${totalTime}ms\n`;

    return output;
  }

  private static getMethodColor(method: string): (text: string) => string {
    const colors: Record<string, (text: string) => string> = {
      GET: chalk.green,
      POST: chalk.blue,
      PUT: chalk.yellow,
      DELETE: chalk.red,
      PATCH: chalk.magenta
    };
    return colors[method.toUpperCase()] || chalk.white;
  }

  private static getStatusColor(status: number): (text: string) => string {
    if (status >= 200 && status < 300) return chalk.green;
    if (status >= 300 && status < 400) return chalk.yellow;
    if (status >= 400) return chalk.red;
    return chalk.gray;
  }
}
