import * as vscode from "vscode";
import { EnvironmentService } from "../extension/environmentService";
import { AuthManager } from "../auth/authManager";
import { requireAuth } from "../auth/authHelper";

export class EnvironmentVariableEditorProvider
  implements vscode.CustomTextEditorProvider
{
  constructor(
    private context: vscode.ExtensionContext,
    private environmentService: EnvironmentService,
    private authManager?: AuthManager
  ) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Extract environment ID from document URI
    const uri = document.uri;
    const envId = uri.path.split("/").pop();
    if (!envId || isNaN(Number(envId))) {
      webviewPanel.webview.html = this.getErrorHtml("Invalid environment ID");
      return;
    }

    // Check authentication
    if (this.authManager && !(await requireAuth(this.authManager, "editing environment variables"))) {
      webviewPanel.webview.html = this.getErrorHtml("Authentication required. Please login to edit environment variables.");
      return;
    }

    // Get environment data
    const env = await this.environmentService.getEnvironmentById(Number(envId));
    if (!env) {
      webviewPanel.webview.html = this.getErrorHtml("Environment not found");
      return;
    }

    const variables = await this.environmentService.getManager().getVariables(String(envId));

    // Setup webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewPanel.webview.html = this.getHtmlForWebview(
      webviewPanel.webview,
      env.name,
      variables
    );

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "saveVariables": {
          const vars = message.variables as Array<{ key: string; value: string }>;
          const varsMap: Record<string, string> = {};
          for (const v of vars) {
            if (v.key.trim()) {
              varsMap[v.key.trim()] = v.value || "";
            }
          }
          try {
            await this.environmentService.updateEnvironmentVariables(
              Number(envId),
              varsMap
            );
            webviewPanel.webview.postMessage({
              type: "variablesSaved",
              success: true,
            });
            // Refresh environment service
            this.environmentService.refresh();
          } catch (error) {
            webviewPanel.webview.postMessage({
              type: "variablesSaved",
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          break;
        }
        case "deleteVariable": {
          const varId = message.varId as string;
          try {
            await this.environmentService.getManager().removeVariable(varId);
            // Reload variables
            const updatedVars = await this.environmentService
              .getManager()
              .getVariables(String(envId));
            webviewPanel.webview.postMessage({
              type: "variablesUpdated",
              variables: updatedVars.map((v) => ({
                id: v.id,
                key: v.key,
                value: v.value,
              })),
            });
            this.environmentService.refresh();
          } catch (error) {
            webviewPanel.webview.postMessage({
              type: "error",
              message: error instanceof Error ? error.message : String(error),
            });
          }
          break;
        }
      }
    });
  }

  private getHtmlForWebview(
    webview: vscode.Webview,
    environmentName: string,
    variables: Array<{ id: string; key: string; value: string }>
  ): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "environmentVariableEditor.js")
    );

    const nonce = Date.now().toString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}' ${webview.cspSource};">
  <title>Environment: ${environmentName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      height: 100vh;
      overflow: auto;
    }
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .header .subtitle {
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .toolbar button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 14px;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
    }
    .toolbar button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .toolbar button.secondary {
      background: transparent;
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border);
    }
    .toolbar button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .variables-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--vscode-editor-background);
    }
    .variables-table thead {
      background: var(--vscode-editor-lineHighlightBackground);
      border-bottom: 2px solid var(--vscode-panel-border);
    }
    .variables-table th {
      text-align: left;
      padding: 12px;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
    }
    .variables-table td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .variables-table tr:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .variables-table input {
      width: 100%;
      background: transparent;
      border: 1px solid var(--vscode-input-border);
      color: var(--vscode-input-foreground);
      padding: 6px 8px;
      font-size: 13px;
      font-family: inherit;
      border-radius: 2px;
    }
    .variables-table input:focus {
      outline: 1px solid var(--vscode-focusBorder);
      outline-offset: -1px;
    }
    .variables-table .actions {
      width: 80px;
      text-align: center;
    }
    .variables-table .delete-btn {
      background: transparent;
      border: none;
      color: var(--vscode-errorForeground);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      opacity: 0.7;
    }
    .variables-table .delete-btn:hover {
      opacity: 1;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--vscode-descriptionForeground);
    }
    .empty-state p {
      margin-bottom: 16px;
    }
    .status-message {
      padding: 8px 12px;
      border-radius: 2px;
      margin-bottom: 16px;
      font-size: 13px;
      display: none;
    }
    .status-message.success {
      background: var(--vscode-testing-iconPassed);
      color: var(--vscode-foreground);
      display: block;
    }
    .status-message.error {
      background: var(--vscode-testing-iconFailed);
      color: var(--vscode-foreground);
      display: block;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${environmentName}</h1>
    <div class="subtitle">Environment Variables</div>
  </div>
  
  <div id="statusMessage" class="status-message"></div>
  
  <div class="toolbar">
    <button id="addVariableBtn" class="secondary">+ Add Variable</button>
    <button id="saveBtn">Save</button>
  </div>
  
  <table class="variables-table">
    <thead>
      <tr>
        <th style="width: 40%;">Key</th>
        <th style="width: 50%;">Value</th>
        <th style="width: 10%;" class="actions">Actions</th>
      </tr>
    </thead>
    <tbody id="variablesBody">
      ${variables.length === 0
        ? '<tr><td colspan="3"><div class="empty-state"><p>No variables yet</p><p>Click "Add Variable" to get started</p></div></td></tr>'
        : variables
            .map(
              (v) => `
        <tr data-id="${v.id}">
          <td><input type="text" class="var-key" value="${this.escapeHtml(v.key)}" placeholder="Variable key" /></td>
          <td><input type="text" class="var-value" value="${this.escapeHtml(v.value)}" placeholder="Variable value" /></td>
          <td class="actions">
            <button class="delete-btn" data-id="${v.id}">Delete</button>
          </td>
        </tr>
      `
            )
            .join("")
      }
    </tbody>
  </table>
  
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let variables = ${JSON.stringify(variables)};
    let hasChanges = false;
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function showStatus(message, type) {
      const statusEl = document.getElementById('statusMessage');
      statusEl.textContent = message;
      statusEl.className = 'status-message ' + type;
      setTimeout(() => {
        statusEl.className = 'status-message';
      }, 3000);
    }
    
    function addVariableRow() {
      const tbody = document.getElementById('variablesBody');
      const emptyState = tbody.querySelector('.empty-state');
      if (emptyState) {
        tbody.innerHTML = '';
      }
      
      const newId = 'new-' + Date.now();
      const row = document.createElement('tr');
      row.setAttribute('data-id', newId);
      row.innerHTML = \`
        <td><input type="text" class="var-key" placeholder="Variable key" /></td>
        <td><input type="text" class="var-value" placeholder="Variable value" /></td>
        <td class="actions">
          <button class="delete-btn" data-id="\${newId}">Delete</button>
        </td>
      \`;
      tbody.appendChild(row);
      hasChanges = true;
      
      // Focus on the key input
      row.querySelector('.var-key').focus();
    }
    
    function deleteVariable(varId) {
      const row = document.querySelector(\`tr[data-id="\${varId}"]\`);
      if (row) {
        row.remove();
        hasChanges = true;
        
        // If no rows left, show empty state
        const tbody = document.getElementById('variablesBody');
        if (tbody.children.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><p>No variables yet</p><p>Click "Add Variable" to get started</p></div></td></tr>';
        }
      }
      
      // If it's not a new variable, notify backend
      if (!varId.startsWith('new-')) {
        vscode.postMessage({
          type: 'deleteVariable',
          varId: varId
        });
      }
    }
    
    function saveVariables() {
      const rows = document.querySelectorAll('#variablesBody tr');
      const vars = [];
      
      rows.forEach(row => {
        const keyInput = row.querySelector('.var-key');
        const valueInput = row.querySelector('.var-value');
        if (keyInput && valueInput) {
          const key = keyInput.value.trim();
          if (key) {
            vars.push({
              key: key,
              value: valueInput.value || ''
            });
          }
        }
      });
      
      vscode.postMessage({
        type: 'saveVariables',
        variables: vars
      });
      hasChanges = false;
    }
    
    // Event listeners
    document.getElementById('addVariableBtn').addEventListener('click', addVariableRow);
    document.getElementById('saveBtn').addEventListener('click', saveVariables);
    
    document.getElementById('variablesBody').addEventListener('input', (e) => {
      if (e.target.classList.contains('var-key') || e.target.classList.contains('var-value')) {
        hasChanges = true;
      }
    });
    
    document.getElementById('variablesBody').addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const varId = e.target.getAttribute('data-id');
        deleteVariable(varId);
      }
    });
    
    // Handle Enter key to add new row
    document.getElementById('variablesBody').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('var-value')) {
        e.preventDefault();
        addVariableRow();
      }
    });
    
    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      switch (message.type) {
        case 'variablesSaved':
          if (message.success) {
            showStatus('Variables saved successfully', 'success');
          } else {
            showStatus('Failed to save: ' + (message.error || 'Unknown error'), 'error');
          }
          break;
        case 'variablesUpdated':
          // Reload variables from backend
          const tbody = document.getElementById('variablesBody');
          tbody.innerHTML = message.variables.map(v => \`
            <tr data-id="\${v.id}">
              <td><input type="text" class="var-key" value="\${escapeHtml(v.key)}" placeholder="Variable key" /></td>
              <td><input type="text" class="var-value" value="\${escapeHtml(v.value)}" placeholder="Variable value" /></td>
              <td class="actions">
                <button class="delete-btn" data-id="\${v.id}">Delete</button>
              </td>
            </tr>
          \`).join('');
          variables = message.variables;
          hasChanges = false;
          break;
      }
    });
  </script>
</body>
</html>`;
  }

  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-errorForeground);
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
  </style>
</head>
<body>
  <p>${this.escapeHtml(message)}</p>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    if (!text) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

