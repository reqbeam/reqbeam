import fs from 'fs-extra';
import path from 'path';
import { TestResult, TestSuite, TestAssertion, ExecutionResult } from '../types.js';

export class TestRunner {
  private static instance: TestRunner;

  private constructor() {}

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * Run tests for a specific request or all tests
   */
  public async runTests(projectPath: string, requestName?: string): Promise<TestSuite> {
    const testsDir = path.join(projectPath, 'tests');
    
    if (!(await fs.pathExists(testsDir))) {
      throw new Error('Tests directory not found. Use "postmind generate-tests" to create test files.');
    }

    const testFiles = await this.getTestFiles(testsDir, requestName);
    const results: TestResult[] = [];

    for (const testFile of testFiles) {
      const result = await this.runTestFile(testFile);
      results.push(result);
    }

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const duration = results.reduce((sum, r) => sum + r.duration, 0);

    return {
      name: requestName ? `Tests for ${requestName}` : 'All Tests',
      results,
      totalTests,
      passedTests,
      failedTests,
      duration,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate test skeleton files for requests that don't have tests
   */
  public async generateTestFiles(projectPath: string, requests: string[]): Promise<string[]> {
    const testsDir = path.join(projectPath, 'tests');
    await fs.ensureDir(testsDir);

    const generatedFiles: string[] = [];

    for (const requestName of requests) {
      const testFileName = `${requestName}.test.js`;
      const testFilePath = path.join(testsDir, testFileName);

      if (!(await fs.pathExists(testFilePath))) {
        const testContent = this.generateTestSkeleton(requestName);
        await fs.writeFile(testFilePath, testContent);
        generatedFiles.push(testFileName);
      }
    }

    return generatedFiles;
  }

  /**
   * Get test files to run
   */
  private async getTestFiles(testsDir: string, requestName?: string): Promise<string[]> {
    const files = await fs.readdir(testsDir);
    const testFiles = files.filter(file => file.endsWith('.test.js'));

    if (requestName) {
      const specificTest = `${requestName}.test.js`;
      if (testFiles.includes(specificTest)) {
        return [path.join(testsDir, specificTest)];
      } else {
        throw new Error(`Test file for request '${requestName}' not found`);
      }
    }

    return testFiles.map(file => path.join(testsDir, file));
  }

  /**
   * Run a single test file
   */
  private async runTestFile(testFilePath: string): Promise<TestResult> {
    const startTime = Date.now();
    const testName = path.basename(testFilePath, '.test.js');
    const assertions: TestAssertion[] = [];

    try {
      // Import the test module
      const testModule = await import(`file://${testFilePath.replace(/\\/g, '/')}`);
      const testFunction = testModule.default;

      if (typeof testFunction !== 'function') {
        throw new Error('Test file must export a default function');
      }

      // Mock response object for testing
      const mockResponse = {
        status: 200,
        data: {},
        headers: {},
        duration: 0
      };

      // Create assertion helpers
      const expect = (actual: any) => ({
        toBe: (expected: any) => {
          const passed = actual === expected;
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toBe(${JSON.stringify(expected)})`,
            passed,
            expected,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
          }
        },
        toEqual: (expected: any) => {
          const passed = JSON.stringify(actual) === JSON.stringify(expected);
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toEqual(${JSON.stringify(expected)})`,
            passed,
            expected,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
          }
        },
        toContain: (expected: any) => {
          const passed = actual && actual.includes && actual.includes(expected);
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toContain(${JSON.stringify(expected)})`,
            passed,
            expected,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
          }
        },
        toBeGreaterThan: (expected: number) => {
          const passed = actual > expected;
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toBeGreaterThan(${expected})`,
            passed,
            expected,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be greater than ${expected}`);
          }
        },
        toBeLessThan: (expected: number) => {
          const passed = actual < expected;
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toBeLessThan(${expected})`,
            passed,
            expected,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be less than ${expected}`);
          }
        },
        toBeDefined: () => {
          const passed = actual !== undefined;
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toBeDefined()`,
            passed,
            expected: 'defined',
            actual: actual === undefined ? 'undefined' : 'defined'
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be defined`);
          }
        },
        toBeNull: () => {
          const passed = actual === null;
          assertions.push({
            description: `expect(${JSON.stringify(actual)}).toBeNull()`,
            passed,
            expected: null,
            actual
          });
          if (!passed) {
            throw new Error(`Expected ${JSON.stringify(actual)} to be null`);
          }
        }
      });

      // Run the test
      await testFunction(mockResponse, { expect });

      const duration = Date.now() - startTime;
      return {
        name: testName,
        passed: true,
        duration,
        assertions
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        name: testName,
        passed: false,
        duration,
        error: error.message,
        assertions
      };
    }
  }

  /**
   * Generate test skeleton content
   */
  private generateTestSkeleton(requestName: string): string {
    return `// tests/${requestName}.test.js
export default function test(response, { expect }) {
  // TODO: Write assertions for ${requestName}
  // Example assertions:
  
  // Check response status
  // expect(response.status).toBe(200);
  
  // Check response data structure
  // expect(response.data).toHaveProperty('id');
  
  // Check response time
  // expect(response.duration).toBeLessThan(1000);
  
  // Check response headers
  // expect(response.headers['content-type']).toContain('application/json');
  
  // Check specific data values
  // expect(response.data.name).toBe('Expected Name');
  
  // Add your custom assertions here...
}`;
  }

  /**
   * Format test results for display
   */
  public formatTestResults(suite: TestSuite): string {
    const { results, totalTests, passedTests, failedTests, duration } = suite;
    
    let output = `\n🧪 Test Results for ${suite.name}\n`;
    output += `═══════════════════════════════════════\n\n`;

    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      const durationStr = `${result.duration}ms`;
      
      output += `${status} ${result.name} (${durationStr})\n`;
      
      if (!result.passed && result.error) {
        output += `   Error: ${result.error}\n`;
      }
      
      if (result.assertions.length > 0) {
        for (const assertion of result.assertions) {
          const assertionStatus = assertion.passed ? '✓' : '✗';
          output += `   ${assertionStatus} ${assertion.description}\n`;
        }
      }
      output += '\n';
    }

    output += `Summary: ${passedTests} passed, ${failedTests} failed, ${totalTests} total (${duration}ms)\n`;
    
    return output;
  }
}
