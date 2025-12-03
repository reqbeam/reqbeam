import * as vscode from "vscode";
import { getDb } from "./db";
import { Workspace } from "../types/models";

export interface WorkspaceTreeItem extends vscode.TreeItem {
  contextValue: "workspace";
  workspaceId: number;
}

export class WorkspaceService
  implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    WorkspaceTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private activeWorkspaceId: number | null = null;
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.activeWorkspaceId = context.globalState.get<number | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  private async persistActiveWorkspace(): Promise<void> {
    await this.context.globalState.update(
      "reqbeam.activeWorkspaceId",
      this.activeWorkspaceId
    );
  }

  getActiveWorkspaceId(): number | null {
    return this.activeWorkspaceId;
  }

  async setActiveWorkspace(id: number | null): Promise<void> {
    this.activeWorkspaceId = id;
    await this.persistActiveWorkspace();
    this.refresh();
  }

  async getActiveWorkspace(): Promise<Workspace | null> {
    if (this.activeWorkspaceId == null) {
      return null;
    }
    return this.getWorkspaceById(this.activeWorkspaceId);
  }

  async getWorkspaces(): Promise<Workspace[]> {
    const db = getDb();
    const rows = await db.all<Workspace[]>(
      `SELECT id, name, description FROM workspaces ORDER BY id ASC`
    );
    return rows;
  }

  async getWorkspaceById(id: number): Promise<Workspace | null> {
    const db = getDb();
    const row = await db.get<Workspace>(
      `SELECT id, name, description FROM workspaces WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  async createWorkspace(name: string, description?: string): Promise<number> {
    const db = getDb();
    const result = await db.run(
      `INSERT INTO workspaces (name, description) VALUES (?, ?)`,
      name,
      description || null
    );
    const id = result.lastID ?? 0;
    // Auto-set as active if it's the first workspace
    if (this.activeWorkspaceId == null) {
      await this.setActiveWorkspace(id);
    }
    this.refresh();
    return id;
  }

  async renameWorkspace(id: number, name: string): Promise<void> {
    const db = getDb();
    await db.run(`UPDATE workspaces SET name = ? WHERE id = ?`, name, id);
    this.refresh();
  }

  async updateWorkspace(
    id: number,
    name: string,
    description?: string
  ): Promise<void> {
    const db = getDb();
    await db.run(
      `UPDATE workspaces SET name = ?, description = ? WHERE id = ?`,
      name,
      description || null,
      id
    );
    this.refresh();
  }

  async deleteWorkspace(id: number): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM workspaces WHERE id = ?`, id);
    if (this.activeWorkspaceId === id) {
      this.activeWorkspaceId = null;
      await this.persistActiveWorkspace();
    }
    this.refresh();
  }

  getTreeItem(element: WorkspaceTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: WorkspaceTreeItem
  ): Promise<WorkspaceTreeItem[]> {
    if (element) {
      return [];
    }
    const workspaces = await this.getWorkspaces();
    return workspaces.map((w) => {
      const item = new vscode.TreeItem(
        w.name,
        vscode.TreeItemCollapsibleState.None
      ) as WorkspaceTreeItem;
      item.contextValue = "workspace";
      item.workspaceId = w.id;
      const isActive = this.activeWorkspaceId === w.id;
      item.description = isActive ? "Active" : "";
      item.command = {
        command: "reqbeam.setWorkspace",
        title: "ReqBeam: Set Active Workspace",
        arguments: [w],
      };
      return item;
    });
  }
}

