#!/usr/bin/env node

// Demo script to test Postmind CLI functionality
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, 'dist', 'index.js');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Running: node ${cliPath} ${command} ${args.join(' ')}`);
    
    const child = spawn('node', [cliPath, command, ...args], {
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      console.log('Output:', output);
      if (error) console.log('Error:', error);
      console.log('Exit code:', code);
      resolve({ code, output, error });
    });
  });
}

async function demo() {
  console.log('🎯 Postmind CLI Demo\n');

  try {
    // 1. Create a project
    console.log('1. Creating a project...');
    await runCommand('init', ['demo-project', '-y']);

    // 2. List projects
    console.log('\n2. Listing projects...');
    await runCommand('project', ['list']);

    // 3. Add environment
    console.log('\n3. Adding environment...');
    await runCommand('env', ['add', 'development', '-i']);

    // 4. List environments
    console.log('\n4. Listing environments...');
    await runCommand('env', ['list']);

    // 5. Create a request
    console.log('\n5. Creating a request...');
    await runCommand('request', ['create', '-n', 'Test Request', '-m', 'GET', '-u', 'https://httpbin.org/get']);

    // 6. List requests
    console.log('\n6. Listing requests...');
    await runCommand('request', ['list']);

    // 7. Run the request
    console.log('\n7. Running the request...');
    await runCommand('run', ['request', 'Test Request']);

    // 8. Create a collection
    console.log('\n8. Creating a collection...');
    await runCommand('collection', ['create', 'Test Collection']);

    // 9. Add request to collection
    console.log('\n9. Adding request to collection...');
    await runCommand('collection', ['add', 'Test Collection', 'Test Request']);

    // 10. List collections
    console.log('\n10. Listing collections...');
    await runCommand('collection', ['list']);

    // 11. Run collection
    console.log('\n11. Running collection...');
    await runCommand('run', ['collection', 'Test Collection']);

    // 12. List history
    console.log('\n12. Listing execution history...');
    await runCommand('run', ['history-list']);

    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

demo();
