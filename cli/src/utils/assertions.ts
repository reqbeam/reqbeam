import { AxiosResponse } from 'axios';
import { Assertion, AssertionResult } from '../types.js';

export function runAssertions(
  response: AxiosResponse,
  assertion: Assertion,
  responseTime: number
): AssertionResult[] {
  const results: AssertionResult[] = [];

  // Check status code
  if (assertion.status !== undefined) {
    results.push({
      name: `Status code is ${assertion.status}`,
      passed: response.status === assertion.status,
      expected: assertion.status,
      actual: response.status,
    });
  }

  // Check status range
  if (assertion.statusRange) {
    const [min, max] = assertion.statusRange;
    const passed = response.status >= min && response.status <= max;
    results.push({
      name: `Status code is between ${min} and ${max}`,
      passed,
      expected: `${min}-${max}`,
      actual: response.status,
    });
  }

  // Check if response contains text
  if (assertion.contains) {
    const contains = Array.isArray(assertion.contains)
      ? assertion.contains
      : [assertion.contains];
    
    for (const text of contains) {
      const responseText = JSON.stringify(response.data);
      const passed = responseText.includes(text);
      results.push({
        name: `Response contains "${text}"`,
        passed,
        expected: text,
        actual: passed ? text : 'not found',
      });
    }
  }

  // Check if response does not contain text
  if (assertion.notContains) {
    const notContains = Array.isArray(assertion.notContains)
      ? assertion.notContains
      : [assertion.notContains];
    
    for (const text of notContains) {
      const responseText = JSON.stringify(response.data);
      const passed = !responseText.includes(text);
      results.push({
        name: `Response does not contain "${text}"`,
        passed,
        expected: `not "${text}"`,
        actual: passed ? 'not found' : 'found',
      });
    }
  }

  // Check headers
  if (assertion.headers) {
    for (const [key, value] of Object.entries(assertion.headers)) {
      const actualValue = response.headers[key.toLowerCase()];
      const passed = actualValue === value;
      results.push({
        name: `Header "${key}" equals "${value}"`,
        passed,
        expected: value,
        actual: actualValue || 'undefined',
      });
    }
  }

  // Check JSON path values
  if (assertion.jsonPath) {
    for (const [path, expectedValue] of Object.entries(assertion.jsonPath)) {
      const actualValue = getJsonPath(response.data, path);
      const passed = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      results.push({
        name: `JSON path "${path}" equals expected value`,
        passed,
        expected: expectedValue,
        actual: actualValue,
      });
    }
  }

  // Check response time
  if (assertion.responseTime !== undefined) {
    const passed = responseTime <= assertion.responseTime;
    results.push({
      name: `Response time is under ${assertion.responseTime}ms`,
      passed,
      expected: `<= ${assertion.responseTime}ms`,
      actual: `${responseTime}ms`,
    });
  }

  return results;
}

function getJsonPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array indices
    const match = part.match(/^(\w+)\[(\d+)\]$/);
    if (match) {
      const [, key, index] = match;
      current = current[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index)];
      }
    } else {
      current = current[part];
    }
  }
  
  return current;
}

