import * as vscode from "vscode";
import { getDb } from "./db";
import { HistoryEntry } from "../types/models";
import { generateId } from "../utils/cuid";
import { AuthManager } from "../auth/authManager";

export class HistoryService implements vscode.TreeDataProvider<HistoryEntry> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    HistoryEntry | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private readonly context: vscode.ExtensionContext;
  private authManager?: AuthManager;

  constructor(context: vscode.ExtensionContext, authManager?: AuthManager) {
    this.context = context;
    this.authManager = authManager;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async addEntry(entry: Omit<HistoryEntry, "id">): Promise<void> {
    const db = getDb();
    
    // Get user email from auth token
    let userEmail: string | null = null;
    let tokenUserId: string | null = null;
    let userName: string | undefined = undefined;
    let userId: string | null = null;
    
    if (this.authManager) {
      const userInfo = await this.authManager.getUserInfo();
      tokenUserId = userInfo?.userId || null;
      userEmail = userInfo?.email || null;
      userName = userInfo?.name;
    }

    // If user is logged in, fetch userId from database
    if (userEmail) {
      // Ensure user exists in local database (sync if needed)
      if (tokenUserId && userEmail) {
        try {
          const { createOrUpdateUserFromAuth } = await import("../storage/users");
          await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
        } catch (error) {
          console.error("Error syncing user before adding history entry:", error);
        }
      }

      // Fetch userId from users table by email
      const user = await db.get<{ id: string }>(
        `SELECT id FROM users WHERE email = ?`,
        userEmail.toLowerCase().trim()
      );
      
      if (user && user.id) {
        userId = user.id;
      }
    }

    const id = generateId();
    const now = new Date().toISOString();
    const workspaceIdStr = entry.workspaceId ? String(entry.workspaceId) : null;
    
    await db.run(
      `INSERT INTO api_history (id, method, url, statusCode, source, duration, userId, workspaceId, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      entry.method,
      entry.url,
      entry.status,
      'extension', // source field is required
      entry.duration,
      userId, // Can be null if user not logged in
      workspaceIdStr,
      now
    );
    this.refresh();
  }

  async getRecent(limit = 50, workspaceId?: string | null): Promise<HistoryEntry[]> {
    const db = getDb();
    
    // Get current user ID
    let userId: string | null = null;
    if (this.authManager) {
      const userInfo = await this.authManager.getUserInfo();
      if (userInfo?.email) {
        const user = await db.get<{ id: string }>(
          `SELECT id FROM users WHERE email = ?`,
          userInfo.email.toLowerCase().trim()
        );
        userId = user?.id || null;
      }
    }
    
    // If no user is logged in, return empty array
    if (!userId) {
      return [];
    }
    
    if (workspaceId != null) {
      const rows = await db.all<HistoryEntry[]>(
        `SELECT id, method, url, statusCode as status, duration, createdAt, workspaceId
         FROM api_history
         WHERE workspaceId = ? AND userId = ?
         ORDER BY datetime(createdAt) DESC
         LIMIT ?`,
        workspaceId,
        userId,
        limit
      );
      return rows;
    }
    const rows = await db.all<HistoryEntry[]>(
      `SELECT id, method, url, statusCode as status, duration, createdAt, workspaceId
       FROM api_history
       WHERE userId = ?
       ORDER BY datetime(createdAt) DESC
       LIMIT ?`,
      userId,
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
    const activeWorkspaceId = this.context.globalState.get<string | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    return this.getRecent(50, activeWorkspaceId);
  }
}


