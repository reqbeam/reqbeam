import chalk from 'chalk';
import { table } from 'table';
export class Formatter {
    static formatExecutionResult(result) {
        const statusColor = result.success ? chalk.green : chalk.red;
        const methodColor = this.getMethodColor(result.method);
        let output = '';
        output += `${methodColor(result.method.padEnd(6))} ${statusColor(result.status.toString().padEnd(3))} `;
        output += `${chalk.blue(result.duration + 'ms')} ${result.name}\n`;
        if (!result.success && result.error) {
            output += `  ${chalk.red('Error:')} ${result.error}\n`;
        }
        return output;
    }
    static formatExecutionResults(results) {
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
    static formatProjects(projects) {
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
    static formatEnvironments(environments) {
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
    static formatRequests(requests) {
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
    static formatCollections(collections) {
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
    static formatHistory(history) {
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
    static formatSummary(results) {
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
    static getMethodColor(method) {
        const colors = {
            GET: chalk.green,
            POST: chalk.blue,
            PUT: chalk.yellow,
            DELETE: chalk.red,
            PATCH: chalk.magenta
        };
        return colors[method.toUpperCase()] || chalk.white;
    }
    static getStatusColor(status) {
        if (status >= 200 && status < 300)
            return chalk.green;
        if (status >= 300 && status < 400)
            return chalk.yellow;
        if (status >= 400)
            return chalk.red;
        return chalk.gray;
    }
}
//# sourceMappingURL=formatter.js.map