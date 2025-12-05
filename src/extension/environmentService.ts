import * as vscode from "vscode";
import { EnvironmentManager } from "../core/environmentManager";
import { Environment } from "../types/models";

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

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.manager = new EnvironmentManager();
    const savedId = context.globalState.get<number | null>(
      "reqbeam.activeEnvironmentId",
      null
    );
    this.activeEnvId = savedId != null ? String(savedId) : null;
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
      this.activeEnvId != null ? Number(this.activeEnvId) : null
    );
  }

  getActiveEnvironmentId(): string | null {
    return this.activeEnvId;
  }

  async setActiveEnvironment(id: number | null): Promise<void> {
    this.activeEnvId = id != null ? String(id) : null;
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
      id: Number(env.id),
      name: env.name,
      variables: JSON.stringify(varsMap),
      workspaceId: env.workspaceId ?? null,
      isActive: true,
    };
  }

  async getEnvironments(workspaceId?: number | null): Promise<Environment[]> {
    const envs = await this.manager.getEnvironments(workspaceId);
    const result: Environment[] = [];

    for (const env of envs) {
      const variables = await this.manager.getVariables(env.id);
      const varsMap: Record<string, string> = {};
      for (const v of variables) {
        varsMap[v.key] = v.value;
      }

      result.push({
        id: Number(env.id),
        name: env.name,
        variables: JSON.stringify(varsMap),
        workspaceId: env.workspaceId ?? null,
        isActive: this.activeEnvId === env.id,
      });
    }

    return result;
  }

  async getEnvironmentById(id: number): Promise<Environment | null> {
    const env = await this.manager.getEnvironment(String(id));
    if (!env) return null;

    const variables = await this.manager.getVariables(String(id));
    const varsMap: Record<string, string> = {};
    for (const v of variables) {
      varsMap[v.key] = v.value;
    }

    return {
      id: Number(env.id),
      name: env.name,
      variables: JSON.stringify(varsMap),
      workspaceId: env.workspaceId ?? null,
      isActive: this.activeEnvId === String(id),
    };
  }

  async createEnvironment(
    name: string,
    workspaceId?: number | null
  ): Promise<void> {
    await this.manager.createEnvironment(name, workspaceId ?? null);
    this.refresh();
  }

  async renameEnvironment(id: number, name: string): Promise<void> {
    await this.manager.updateEnvironment(String(id), { name });
    this.refresh();
  }

  async deleteEnvironment(id: number): Promise<void> {
    await this.manager.deleteEnvironment(String(id));
    if (this.activeEnvId === String(id)) {
      this.activeEnvId = null;
      await this.persistActiveEnv();
    }
    this.refresh();
  }

  async duplicateEnvironment(id: number, newName: string): Promise<void> {
    await this.manager.duplicateEnvironment(String(id), newName);
    this.refresh();
  }

  async updateEnvironmentVariables(
    id: number,
    variables: Record<string, string>
  ): Promise<void> {
    // Delete all existing variables
    const existing = await this.manager.getVariables(String(id));
    for (const v of existing) {
      await this.manager.removeVariable(v.id);
    }

    // Add new variables
    for (const [key, value] of Object.entries(variables)) {
      if (key.trim()) {
        await this.manager.setVariable(String(id), key.trim(), value);
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
    item.command = {
      command: "reqbeam.quickEditEnvironmentVariables",
      title: "ReqBeam: Edit Environment Variables",
      arguments: [{ id: Number(element.id), name: element.name }],
    };
    return item;
  }

  async getChildren(element?: EnvironmentItem): Promise<EnvironmentItem[]> {
    if (element) {
      return [];
    }
    const activeWorkspaceId = this.context.globalState.get<number | null>(
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


