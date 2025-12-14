import * as vscode from "vscode";
import { EnvironmentManager } from "../core/environmentManager";
import { Environment } from "../types/models";
import { AuthManager } from "../auth/authManager";

export class EnvironmentService
  implements vscode.TreeDataProvider<EnvironmentItem>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    EnvironmentItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private activeEnvId: string | null = null;
  private readonly context: vscode.ExtensionContext;
  private readonly manager: EnvironmentManager;
  private authManager?: AuthManager;

  constructor(context: vscode.ExtensionContext, authManager?: AuthManager) {
    this.context = context;
    this.authManager = authManager;
    this.manager = new EnvironmentManager();
    const savedId = context.globalState.get<string | null>(
      "reqbeam.activeEnvironmentId",
      null
    );
    this.activeEnvId = savedId;
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private async persistActiveEnv(): Promise<void> {
    await this.context.globalState.update(
      "reqbeam.activeEnvironmentId",
      this.activeEnvId
    );
  }

  getActiveEnvironmentId(): string | null {
    return this.activeEnvId;
  }

  async setActiveEnvironment(id: string | null): Promise<void> {
    this.activeEnvId = id;
    await this.persistActiveEnv();
    this.refresh();
  }

  async getActiveEnvironment(): Promise<Environment | null> {
    if (this.activeEnvId == null) {
      return null;
    }
    const env = await this.manager.getEnvironment(this.activeEnvId);
    if (!env) return null;

    const variables = await this.manager.getVariables(this.activeEnvId);
    const varsMap: Record<string, string> = {};
    for (const v of variables) {
      varsMap[v.key] = v.value;
    }

    return {
      id: env.id,
      name: env.name,
      variables: JSON.stringify(varsMap),
      workspaceId: env.workspaceId ?? null,
      isActive: true,
    };
  }

  async getEnvironments(workspaceId?: string | null): Promise<Environment[]> {
    const envs = await this.manager.getEnvironments(workspaceId);
    const result: Environment[] = [];

    for (const env of envs) {
      const variables = await this.manager.getVariables(env.id);
      const varsMap: Record<string, string> = {};
      for (const v of variables) {
        varsMap[v.key] = v.value;
      }

      result.push({
        id: env.id,
        name: env.name,
        variables: JSON.stringify(varsMap),
        workspaceId: env.workspaceId ?? null,
        isActive: this.activeEnvId === env.id,
      });
    }

    return result;
  }

  async getEnvironmentById(id: string): Promise<Environment | null> {
    const env = await this.manager.getEnvironment(id);
    if (!env) return null;

    const variables = await this.manager.getVariables(id);
    const varsMap: Record<string, string> = {};
    for (const v of variables) {
      varsMap[v.key] = v.value;
    }

    return {
      id: env.id,
      name: env.name,
      variables: JSON.stringify(varsMap),
      workspaceId: env.workspaceId ?? null,
      isActive: this.activeEnvId === id,
    };
  }

  async createEnvironment(
    name: string,
    workspaceId?: string | null
  ): Promise<void> {
    const { getDb } = await import("../extension/db");
    const db = getDb();
    
    // Get user email from auth token
    let userEmail: string | null = null;
    let tokenUserId: string | null = null;
    let userName: string | undefined = undefined;
    
    if (this.authManager) {
      const userInfo = await this.authManager.getUserInfo();
      tokenUserId = userInfo?.userId || null;
      userEmail = userInfo?.email || null;
      userName = userInfo?.name;
    }
    
    if (!userEmail) {
      throw new Error("User must be logged in to create environments");
    }

    // Ensure user exists in local database (sync if needed)
    if (tokenUserId && userEmail) {
      try {
        const { createOrUpdateUserFromAuth } = await import("../storage/users");
        await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
      } catch (error) {
        console.error("Error syncing user before creating environment:", error);
      }
    }

    // Fetch userId from users table by email (ensures we use the actual database ID)
    const user = await db.get<{ id: string }>(
      `SELECT id FROM users WHERE email = ?`,
      userEmail.toLowerCase().trim()
    );
    
    if (!user || !user.id) {
      throw new Error(`User with email ${userEmail} does not exist in local database. Please log out and log back in.`);
    }

    const userId = user.id;

    // If workspaceId is not provided, use the active workspace
    const activeWorkspaceId = workspaceId ?? this.context.globalState.get<string | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    await this.manager.createEnvironment(name, activeWorkspaceId, userId);
    this.refresh();
  }

  async renameEnvironment(id: string, name: string): Promise<void> {
    await this.manager.updateEnvironment(id, { name });
    this.refresh();
  }

  async deleteEnvironment(id: string): Promise<void> {
    await this.manager.deleteEnvironment(id);
    if (this.activeEnvId === id) {
      this.activeEnvId = null;
      await this.persistActiveEnv();
    }
    this.refresh();
  }

  async duplicateEnvironment(id: string, newName: string): Promise<void> {
    const { getDb } = await import("../extension/db");
    const db = getDb();
    
    // Get user email from auth token
    let userEmail: string | null = null;
    let tokenUserId: string | null = null;
    let userName: string | undefined = undefined;
    
    if (this.authManager) {
      const userInfo = await this.authManager.getUserInfo();
      tokenUserId = userInfo?.userId || null;
      userEmail = userInfo?.email || null;
      userName = userInfo?.name;
    }
    
    if (!userEmail) {
      throw new Error("User must be logged in to duplicate environments");
    }

    // Ensure user exists in local database (sync if needed)
    if (tokenUserId && userEmail) {
      try {
        const { createOrUpdateUserFromAuth } = await import("../storage/users");
        await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
      } catch (error) {
        console.error("Error syncing user before duplicating environment:", error);
      }
    }

    // Fetch userId from users table by email (ensures we use the actual database ID)
    const user = await db.get<{ id: string }>(
      `SELECT id FROM users WHERE email = ?`,
      userEmail.toLowerCase().trim()
    );
    
    if (!user || !user.id) {
      throw new Error(`User with email ${userEmail} does not exist in local database. Please log out and log back in.`);
    }

    const userId = user.id;

    await this.manager.duplicateEnvironment(id, newName, userId);
    this.refresh();
  }

  async updateEnvironmentVariables(
    id: string,
    variables: Record<string, string>
  ): Promise<void> {
    // Delete all existing variables
    const existing = await this.manager.getVariables(id);
    for (const v of existing) {
      await this.manager.removeVariableByKey(id, v.key);
    }

    // Add new variables
    for (const [key, value] of Object.entries(variables)) {
      if (key.trim()) {
        await this.manager.setVariable(id, key.trim(), value);
      }
    }
    this.refresh();
  }

  getManager(): EnvironmentManager {
    return this.manager;
  }

  getTreeItem(element: EnvironmentItem): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.name,
      vscode.TreeItemCollapsibleState.None
    );
    const isActive = this.activeEnvId === element.id;
    item.description = isActive ? "Active" : "";
    item.contextValue = isActive ? "environment-active" : "environment";
    // Clicking on the environment opens the editor, but we also have a menu for other actions
    item.command = {
      command: "reqbeam.openEnvironmentEditor",
      title: "ReqBeam: Edit Environment Variables",
      arguments: [{ id: element.id, name: element.name }],
    };
    return item;
  }

  async getChildren(element?: EnvironmentItem): Promise<EnvironmentItem[]> {
    if (element) {
      return [];
    }
    const activeWorkspaceId = this.context.globalState.get<string | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    const envs = await this.manager.getEnvironments(activeWorkspaceId);
    return envs.map((e) => ({
      id: e.id,
      name: e.name,
    }));
  }
}

interface EnvironmentItem {
  id: string;
  name: string;
}


