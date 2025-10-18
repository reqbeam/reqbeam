import inquirer from 'inquirer';
import chalk from 'chalk';
import { makeRequest } from '../utils/request.js';
import { formatResponse, formatError, formatSuccess } from '../utils/formatter.js';
import fs from 'fs-extra';
import path from 'path';

interface InteractiveAnswers {
  action: string;
  method?: string;
  url?: string;
  headers?: string;
  body?: string;
  collectionName?: string;
  requestName?: string;
  saveToCollection?: boolean;
}

export async function interactiveCommand(): Promise<void> {
  console.log(chalk.cyan.bold('\n🎯 Interactive API CLI Mode\n'));
  console.log(chalk.gray('Type your commands or select from options\n'));

  let keepRunning = true;

  while (keepRunning) {
    try {
      const { action } = await inquirer.prompt<InteractiveAnswers>([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: '🚀 Make a Request', value: 'request' },
            { name: '📁 Create Collection', value: 'collection' },
            { name: '🧪 Run Tests', value: 'test' },
            { name: '🚪 Exit', value: 'exit' },
          ],
        },
      ]);

      switch (action) {
        case 'request':
          await handleRequest();
          break;
        case 'collection':
          await handleCreateCollection();
          break;
        case 'test':
          await handleRunTests();
          break;
        case 'exit':
          keepRunning = false;
          console.log(chalk.cyan('\n👋 Goodbye!\n'));
          break;
      }
    } catch (error: any) {
      if (error.isTtyError) {
        formatError('Interactive mode not supported in this environment');
        keepRunning = false;
      } else {
        formatError(error.message);
      }
    }
  }
}

async function handleRequest(): Promise<void> {
  const answers = await inquirer.prompt<InteractiveAnswers>([
    {
      type: 'list',
      name: 'method',
      message: 'Select HTTP method:',
      choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    {
      type: 'input',
      name: 'url',
      message: 'Enter URL:',
      validate: (input) => {
        if (!input) return 'URL is required';
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'input',
      name: 'headers',
      message: 'Enter headers (JSON format, optional):',
      default: '{}',
    },
    {
      type: 'input',
      name: 'body',
      message: 'Enter request body (JSON format, optional):',
      default: '{}',
      when: (answers) => answers.method !== 'GET',
    },
    {
      type: 'confirm',
      name: 'saveToCollection',
      message: 'Save this request to a collection?',
      default: false,
    },
  ]);

  try {
    // Parse headers
    let headers = {};
    if (answers.headers && answers.headers !== '{}') {
      try {
        headers = JSON.parse(answers.headers);
      } catch {
        formatError('Invalid JSON in headers');
        return;
      }
    }

    // Parse body
    let body;
    if (answers.body && answers.body !== '{}') {
      try {
        body = JSON.parse(answers.body);
      } catch {
        formatError('Invalid JSON in body');
        return;
      }
    }

    // Make request
    console.log(chalk.cyan('\n🚀 Making request...\n'));
    const response = await makeRequest(
      {
        name: 'Interactive Request',
        method: answers.method!,
        url: answers.url!,
        headers,
        body,
      },
      {}
    );

    formatResponse(response, true);

    // Save to collection if requested
    if (answers.saveToCollection) {
      await saveRequestToCollection({
        method: answers.method!,
        url: answers.url!,
        headers,
        body,
      });
    }
  } catch (error: any) {
    formatError(error.message);
  }
}

async function handleCreateCollection(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'collectionName',
      message: 'Collection name:',
      validate: (input) => (input ? true : 'Collection name is required'),
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description (optional):',
    },
    {
      type: 'input',
      name: 'filename',
      message: 'Filename:',
      default: (answers: any) => `${answers.collectionName.toLowerCase().replace(/\s+/g, '-')}.json`,
    },
  ]);

  const collection = {
    name: answers.collectionName,
    description: answers.description || '',
    requests: [],
  };

  const filepath = path.resolve(process.cwd(), answers.filename);
  await fs.writeJSON(filepath, collection, { spaces: 2 });
  formatSuccess(`Collection created: ${answers.filename}`);
}

async function handleRunTests(): Promise<void> {
  const { filepath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filepath',
      message: 'Enter collection file path:',
      validate: async (input) => {
        if (!input) return 'File path is required';
        if (await fs.pathExists(path.resolve(process.cwd(), input))) {
          return true;
        }
        return 'File not found';
      },
    },
  ]);

  // Use the test command
  const { testCommand } = await import('./test.js');
  await testCommand(filepath, {});
}

async function saveRequestToCollection(request: any): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'requestName',
      message: 'Request name:',
      validate: (input) => (input ? true : 'Request name is required'),
    },
    {
      type: 'input',
      name: 'collectionFile',
      message: 'Collection file (will be created if not exists):',
      default: 'collection.json',
    },
  ]);

  const filepath = path.resolve(process.cwd(), answers.collectionFile);
  
  let collection: any;
  if (await fs.pathExists(filepath)) {
    collection = await fs.readJSON(filepath);
  } else {
    collection = {
      name: 'My Collection',
      requests: [],
    };
  }

  collection.requests.push({
    name: answers.requestName,
    ...request,
  });

  await fs.writeJSON(filepath, collection, { spaces: 2 });
  formatSuccess(`Request saved to ${answers.collectionFile}`);
}

