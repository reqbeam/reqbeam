import fs from 'fs-extra';
import path from 'path';
import { TestResult } from '../types.js';

export async function generateHtmlReport(
  results: TestResult[],
  outputPath: string,
  collectionName: string
): Promise<void> {
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);
  const timestamp = new Date().toISOString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Report - ${collectionName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .meta {
      opacity: 0.9;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary-card .label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .summary-card.passed .value {
      color: #10b981;
    }
    .summary-card.failed .value {
      color: #ef4444;
    }
    .summary-card.time .value {
      color: #3b82f6;
    }
    .results {
      padding: 30px;
    }
    .test-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .test-header {
      padding: 20px;
      background: #f9fafb;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .test-item.passed .test-header {
      border-left: 4px solid #10b981;
    }
    .test-item.failed .test-header {
      border-left: 4px solid #ef4444;
    }
    .test-icon {
      font-size: 24px;
    }
    .test-item.passed .test-icon {
      color: #10b981;
    }
    .test-item.failed .test-icon {
      color: #ef4444;
    }
    .test-info {
      flex: 1;
    }
    .test-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .test-meta {
      font-size: 14px;
      color: #6b7280;
    }
    .method {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 10px;
    }
    .method.GET {
      background: #d1fae5;
      color: #065f46;
    }
    .method.POST {
      background: #fef3c7;
      color: #92400e;
    }
    .method.PUT {
      background: #dbeafe;
      color: #1e40af;
    }
    .method.DELETE {
      background: #fee2e2;
      color: #991b1b;
    }
    .test-stats {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }
    .test-body {
      padding: 20px;
    }
    .test-url {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      margin-bottom: 15px;
      word-break: break-all;
    }
    .assertions {
      margin-top: 15px;
    }
    .assertions-title {
      font-weight: 600;
      margin-bottom: 10px;
    }
    .assertion {
      padding: 10px;
      border-left: 3px solid #e5e7eb;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .assertion.passed {
      background: #f0fdf4;
      border-left-color: #10b981;
    }
    .assertion.failed {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    .assertion-icon {
      margin-right: 8px;
    }
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 15px;
      border-radius: 4px;
      color: #991b1b;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>API Test Report</h1>
      <div class="meta">
        <div><strong>Collection:</strong> ${collectionName}</div>
        <div><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card passed">
        <div class="label">Passed</div>
        <div class="value">${passed}</div>
      </div>
      <div class="summary-card failed">
        <div class="label">Failed</div>
        <div class="value">${failed}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Tests</div>
        <div class="value">${results.length}</div>
      </div>
      <div class="summary-card time">
        <div class="label">Total Time</div>
        <div class="value">${totalTime}ms</div>
      </div>
    </div>

    <div class="results">
      ${results.map(result => `
        <div class="test-item ${result.passed ? 'passed' : 'failed'}">
          <div class="test-header">
            <div class="test-icon">${result.passed ? '✓' : '✗'}</div>
            <div class="test-info">
              <div class="test-name">${result.name}</div>
              <div class="test-meta">
                <span class="method ${result.method}">${result.method}</span>
                ${result.error ? `<span style="color: #ef4444;">Error</span>` : `
                  <span>Status: ${result.status} ${result.statusText}</span>
                  <span style="margin-left: 10px;">Time: ${result.responseTime}ms</span>
                `}
              </div>
            </div>
          </div>
          <div class="test-body">
            <div class="test-url">${result.url}</div>
            
            ${result.error ? `
              <div class="error">
                <strong>Error:</strong> ${result.error}
              </div>
            ` : ''}
            
            ${result.assertions.length > 0 ? `
              <div class="assertions">
                <div class="assertions-title">Assertions (${result.assertions.filter(a => a.passed).length}/${result.assertions.length} passed)</div>
                ${result.assertions.map(assertion => `
                  <div class="assertion ${assertion.passed ? 'passed' : 'failed'}">
                    <span class="assertion-icon">${assertion.passed ? '✓' : '✗'}</span>
                    <span>${assertion.name}</span>
                    ${!assertion.passed && assertion.expected !== undefined ? `
                      <div style="margin-top: 8px; margin-left: 24px; font-size: 13px;">
                        <div style="color: #6b7280;">Expected: <code>${JSON.stringify(assertion.expected)}</code></div>
                        <div style="color: #6b7280;">Actual: <code>${JSON.stringify(assertion.actual)}</code></div>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;

  const resolvedPath = path.resolve(process.cwd(), outputPath);
  await fs.ensureDir(path.dirname(resolvedPath));
  await fs.writeFile(resolvedPath, html, 'utf-8');
}

