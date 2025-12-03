import * as vscode from "vscode";
import { getDb } from "./db";
import { Environment } from "../types/models";

export class EnvironmentService
  implements vscode.TreeDataProvider<Environment>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    Environment | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private activeEnvId: number | null = null;
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.activeEnvId = context.globalState.get<number | null>(
      "reqbeam.activeEnvironmentId",
      null
    );
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private async persistActiveEnv(): Promise<void> {
    await this.context.globalState.update("reqbeam.activeEnvironmentId", this.activeEnvId);
  }

  getActiveEnvironmentId(): number | null {
    return this.activeEnvId;
  }

  async setActiveEnvironment(id: number | null): Promise<void> {
    this.activeEnvId = id;
    await this.persistActiveEnv();
    this.refresh();
  }

  async getActiveEnvironment(): Promise<Environment | null> {
    if (this.activeEnvId == null) {
      return null;
    }
    return this.getEnvironmentById(this.activeEnvId);
  }

  async getEnvironments(workspaceId?: number | null): Promise<Environment[]> {
    const db = getDb();
    if (workspaceId != null) {
      const rows = await db.all<Environment[]>(
        `SELECT id, name, variables, workspaceId, isActive FROM environments WHERE workspaceId = ? ORDER BY id ASC`,
        workspaceId
      );
      return rows;
    }
    const rows = await db.all<Environment[]>(
      `SELECT id, name, variables, workspaceId, isActive FROM environments ORDER BY id ASC`
    );
    return rows;
  }

  async getEnvironmentById(id: number): Promise<Environment | null> {
    const db = getDb();
    const row = await db.get<Environment>(
      `SELECT id, name, variables, workspaceId, isActive FROM environments WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  async createEnvironment(
    name: string,
    workspaceId?: number | null
  ): Promise<void> {
    const db = getDb();
    await db.run(
      `INSERT INTO environments (name, variables, workspaceId, isActive) VALUES (?, ?, ?, ?)`,
      name,
      "{}",
      workspaceId ?? null,
      0
    );
    this.refresh();
  }

  async renameEnvironment(id: number, name: string): Promise<void> {
    const db = getDb();
    await db.run(`UPDATE environments SET name = ? WHERE id = ?`, name, id);
    this.refresh();
  }

  async deleteEnvironment(id: number): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM environments WHERE id = ?`, id);
    if (this.activeEnvId === id) {
      this.activeEnvId = null;
      await this.persistActiveEnv();
    }
    this.refresh();
  }

  getTreeItem(element: Environment): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.name,
      vscode.TreeItemCollapsibleState.None
    );
    const isActive = this.activeEnvId === element.id;
    item.description = isActive ? "Active" : "";
    item.contextValue = isActive ? "environment-active" : "environment";
    item.command = {
      command: "reqbeam.setEnvironment",
      title: "ReqBeam: Set Active Environment",
      arguments: [element],
    };
    return item;
  }

  async getChildren(element?: Environment): Promise<Environment[]> {
    if (element) {
      return [];
    }
    // Filter by active workspace if set
    const activeWorkspaceId = this.context.globalState.get<number | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    return this.getEnvironments(activeWorkspaceId);
  }
}


