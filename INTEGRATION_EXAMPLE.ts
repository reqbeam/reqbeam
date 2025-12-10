/**
 * Integration Example for activate.ts
 * 
 * Add this import and function call to your src/extension/activate.ts file:
 */

import { registerImportExportCommands } from "../commands/importExport";

// In your activate function, after creating services and state:
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // ... existing code ...
  
  const state: ReqBeamContext = {
    panels: new Map(),
    workspaceService,
    collectionService,
    environmentService,
    historyService,
    requestRunner,
  };

  registerCommands(context, state);
  
  // ADD THIS LINE:
  registerImportExportCommands(context, collectionService, workspaceService);
  
  // ... rest of existing code ...
}

