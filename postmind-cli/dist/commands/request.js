import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { StorageManager } from '../utils/storage.js';
import { Formatter } from '../utils/formatter.js';
const requestCommand = new Command('request');
requestCommand
    .description('Manage API requests');
// Create request
requestCommand
    .command('create')
    .description('Create a new request')
    .option('-n, --name <name>', 'Name of the request')
    .option('-m, --method <method>', 'HTTP method (GET, POST, PUT, DELETE, PATCH)')
    .option('-u, --url <url>', 'Request URL')
    .option('-H, --headers <headers>', 'Headers as key:value pairs (comma-separated)')
    .option('-b, --body <body>', 'Request body (JSON string or file path)')
    .option('-d, --description <description>', 'Request description')
    .option('-i, --interactive', 'Create request interactively')
    .action(async (options) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        let requestData = {};
        if (options.interactive || !options.name) {
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Request name:',
                    validate: (input) => input.trim() ? true : 'Name is required'
                },
                {
                    type: 'list',
                    name: 'method',
                    message: 'HTTP method:',
                    choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
                    default: 'GET'
                },
                {
                    type: 'input',
                    name: 'url',
                    message: 'Request URL:',
                    validate: (input) => input.trim() ? true : 'URL is required'
                },
                {
                    type: 'input',
                    name: 'headers',
                    message: 'Headers (key:value pairs, comma-separated):',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'body',
                    message: 'Request body (JSON string or file path):',
                    default: ''
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Description (optional):',
                    default: ''
                }
            ]);
            requestData = answers;
        }
        else {
            requestData = {
                name: options.name,
                method: options.method || 'GET',
                url: options.url || '',
                headers: options.headers ? parseHeaders(options.headers) : undefined,
                body: options.body || undefined,
                description: options.description || undefined
            };
        }
        // Validate required fields
        if (!requestData.name || !requestData.url) {
            console.log(chalk.red('Name and URL are required'));
            process.exit(1);
        }
        // Check if request already exists
        const requestExists = config.requests.some(r => r.name === requestData.name);
        if (requestExists) {
            console.log(chalk.red(`Request '${requestData.name}' already exists`));
            process.exit(1);
        }
        // Parse headers if provided
        if (requestData.headers && typeof requestData.headers === 'string') {
            requestData.headers = parseHeaders(requestData.headers);
        }
        // Parse body if it's a JSON string
        if (requestData.body && typeof requestData.body === 'string') {
            try {
                requestData.body = JSON.parse(requestData.body);
            }
            catch {
                // Keep as string if not valid JSON
            }
        }
        const request = {
            name: requestData.name,
            method: requestData.method,
            url: requestData.url,
            headers: requestData.headers,
            body: requestData.body,
            description: requestData.description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        config.requests.push(request);
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Request '${request.name}' created successfully`));
    }
    catch (error) {
        console.error(chalk.red('Error creating request:'), error.message);
        process.exit(1);
    }
});
// List requests
requestCommand
    .command('list')
    .description('List all requests in the current project')
    .action(async () => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        console.log(chalk.bold('Requests:'));
        console.log(Formatter.formatRequests(config.requests));
    }
    catch (error) {
        console.error(chalk.red('Error listing requests:'), error.message);
        process.exit(1);
    }
});
// Update request
requestCommand
    .command('update')
    .argument('<name>', 'Name of the request to update')
    .description('Update an existing request')
    .option('-m, --method <method>', 'HTTP method')
    .option('-u, --url <url>', 'Request URL')
    .option('-H, --headers <headers>', 'Headers as key:value pairs')
    .option('-b, --body <body>', 'Request body')
    .option('-d, --description <description>', 'Request description')
    .action(async (name, options) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        const requestIndex = config.requests.findIndex(r => r.name === name);
        if (requestIndex === -1) {
            console.log(chalk.red(`Request '${name}' not found`));
            process.exit(1);
        }
        const request = config.requests[requestIndex];
        // Update fields if provided
        if (options.method)
            request.method = options.method;
        if (options.url)
            request.url = options.url;
        if (options.headers)
            request.headers = parseHeaders(options.headers);
        if (options.body !== undefined) {
            try {
                request.body = JSON.parse(options.body);
            }
            catch {
                request.body = options.body;
            }
        }
        if (options.description !== undefined)
            request.description = options.description;
        request.updatedAt = new Date().toISOString();
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Request '${name}' updated successfully`));
    }
    catch (error) {
        console.error(chalk.red('Error updating request:'), error.message);
        process.exit(1);
    }
});
// Delete request
requestCommand
    .command('delete')
    .argument('<name>', 'Name of the request to delete')
    .description('Delete a request')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (name, options) => {
    try {
        const storage = StorageManager.getInstance();
        const currentProject = await storage.getCurrentProject();
        if (!currentProject) {
            console.log(chalk.red('No current project. Use "postmind init <name>" to create a project first.'));
            process.exit(1);
        }
        const config = await storage.loadProjectConfig(currentProject);
        const requestIndex = config.requests.findIndex(r => r.name === name);
        if (requestIndex === -1) {
            console.log(chalk.red(`Request '${name}' not found`));
            process.exit(1);
        }
        // Confirm deletion unless -f flag is used
        if (!options.force) {
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: `Are you sure you want to delete request '${name}'?`,
                    default: false
                }
            ]);
            if (!confirm) {
                console.log(chalk.yellow('Request deletion cancelled'));
                process.exit(0);
            }
        }
        config.requests.splice(requestIndex, 1);
        // Remove from collections
        config.collections.forEach(collection => {
            collection.requests = collection.requests.filter(reqName => reqName !== name);
        });
        await storage.saveProjectConfig(currentProject, config);
        console.log(chalk.green(`✓ Request '${name}' deleted successfully`));
    }
    catch (error) {
        console.error(chalk.red('Error deleting request:'), error.message);
        process.exit(1);
    }
});
// Helper function to parse headers
function parseHeaders(headersString) {
    const headers = {};
    if (!headersString || !headersString.trim())
        return headers;
    headersString.split(',').forEach(pair => {
        const trimmedPair = pair.trim();
        if (trimmedPair) {
            const colonIndex = trimmedPair.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmedPair.substring(0, colonIndex).trim();
                const value = trimmedPair.substring(colonIndex + 1).trim();
                if (key && value) {
                    headers[key] = value;
                }
            }
        }
    });
    return headers;
}
export { requestCommand };
//# sourceMappingURL=request.js.map