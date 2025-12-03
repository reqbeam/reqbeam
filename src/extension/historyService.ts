import * as vscode from "vscode";
import { getDb } from "./db";
import { HistoryEntry } from "../types/models";

export class HistoryService implements vscode.TreeDataProvider<HistoryEntry> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    HistoryEntry | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private readonly context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async addEntry(entry: Omit<HistoryEntry, "id">): Promise<void> {
    const db = getDb();
    await db.run(
      `INSERT INTO history (method, url, status, duration, createdAt, workspaceId)
       VALUES (?, ?, ?, ?, ?, ?)`,
      entry.method,
      entry.url,
      entry.status,
      entry.duration,
      entry.createdAt,
      entry.workspaceId ?? null
    );
    this.refresh();
  }

  async getRecent(limit = 50, workspaceId?: number | null): Promise<HistoryEntry[]> {
    const db = getDb();
    if (workspaceId != null) {
      const rows = await db.all<HistoryEntry[]>(
        `SELECT id, method, url, status, duration, createdAt, workspaceId
         FROM history
         WHERE workspaceId = ?
         ORDER BY datetime(createdAt) DESC
         LIMIT ?`,
        workspaceId,
        limit
      );
      return rows;
    }
    const rows = await db.all<HistoryEntry[]>(
      `SELECT id, method, url, status, duration, createdAt, workspaceId
       FROM history
       ORDER BY datetime(createdAt) DESC
       LIMIT ?`,
      limit
    );
    return rows;
  }

  getTreeItem(element: HistoryEntry): vscode.TreeItem {
    const label = `${element.method} ${element.url}`;
    const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
    item.description = `${element.status} • ${element.duration}ms`;
    item.command = {
      command: "reqbeam.showHistoryItem",
      title: "ReqBeam: Load History Item",
      arguments: [element],
    };
    return item;
  }

  async getChildren(element?: HistoryEntry): Promise<HistoryEntry[]> {
    if (element) {
      return [];
    }
    const activeWorkspaceId = this.context.globalState.get<number | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    return this.getRecent(50, activeWorkspaceId);
  }
}


