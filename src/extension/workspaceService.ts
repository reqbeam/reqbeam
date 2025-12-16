import * as vscode from "vscode";
import { getDb } from "./db";
import { Workspace } from "../types/models";
import { generateId } from "../utils/cuid";
import { AuthManager } from "../auth/authManager";

export interface WorkspaceTreeItem extends vscode.TreeItem {
  contextValue: "workspace";
  workspaceId: string | number;
}

export class WorkspaceService
  implements vscode.TreeDataProvider<WorkspaceTreeItem>, vscode.Disposable
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    WorkspaceTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private activeWorkspaceId: string | number | null = null;
  private readonly context: vscode.ExtensionContext;
  private authManager?: AuthManager;

  constructor(context: vscode.ExtensionContext, authManager?: AuthManager) {
    this.context = context;
    this.authManager = authManager;
    // Support both string and number IDs during migration
    const storedId = context.globalState.get<string | number | null>(
      "reqbeam.activeWorkspaceId",
      null
    );
    this.activeWorkspaceId = storedId;
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

  getActiveWorkspaceId(): string | number | null {
    return this.activeWorkspaceId;
  }

  async setActiveWorkspace(id: string | number | null): Promise<void> {
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
    
    const rows = await db.all<Workspace[]>(
      `SELECT id, name, description FROM workspaces WHERE ownerId = ? ORDER BY id ASC`,
      userId
    );
    return rows;
  }

  async getWorkspaceById(id: string | number): Promise<Workspace | null> {
    const db = getDb();
    const row = await db.get<Workspace>(
      `SELECT id, name, description FROM workspaces WHERE id = ?`,
      String(id)
    );
    return row ?? null;
  }

  async createWorkspace(name: string, description?: string): Promise<string> {
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
      throw new Error("User must be logged in to create workspaces");
    }

    // Ensure user exists in local database (sync if needed)
    if (tokenUserId && userEmail) {
      try {
        const { createOrUpdateUserFromAuth } = await import("../storage/users");
        await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
      } catch (error) {
        console.error("Error syncing user before creating workspace:", error);
      }
    }

    // Fetch userId from users table by email (ensures we use the actual database ID)
    // Try by email first, then by tokenUserId if available
    let user = await db.get<{ id: string }>(
      `SELECT id FROM users WHERE email = ?`,
      userEmail.toLowerCase().trim()
    );
    
    // If not found by email and we have tokenUserId, try by ID
    if (!user && tokenUserId) {
      user = await db.get<{ id: string }>(
        `SELECT id FROM users WHERE id = ?`,
        tokenUserId
      );
    }
    
    if (!user || !user.id) {
      // Last attempt: sync user again and retry
      if (tokenUserId && userEmail) {
        try {
          const { createOrUpdateUserFromAuth } = await import("../storage/users");
          await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
          // Retry fetch after sync
          user = await db.get<{ id: string }>(
            `SELECT id FROM users WHERE email = ? OR id = ?`,
            userEmail.toLowerCase().trim(),
            tokenUserId
          );
        } catch (error) {
          console.error("Error syncing user on retry:", error);
        }
      }
      
      if (!user || !user.id) {
        throw new Error(`User with email ${userEmail} does not exist in local database. Please log out and log back in.`);
      }
    }

    const ownerId = user.id; // Use ownerId variable name to match database field

    // Verify ownerId is not null/empty before inserting
    if (!ownerId || ownerId.trim() === '') {
      throw new Error(`Invalid user ID retrieved from database for email ${userEmail}`);
    }

    // Generate CUID for ID
    const id = generateId();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO workspaces (id, name, description, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      name,
      description || null,
      ownerId, // Use the fetched userId as ownerId - this must match a valid user.id
      now,
      now
    );
    
    // Auto-set as active if it's the first workspace
    if (this.activeWorkspaceId == null) {
      await this.setActiveWorkspace(id);
    }
    this.refresh();
    return id;
  }

  async renameWorkspace(id: string | number, name: string): Promise<void> {
    const db = getDb();
    await db.run(`UPDATE workspaces SET name = ?, updatedAt = ? WHERE id = ?`, name, new Date().toISOString(), String(id));
    this.refresh();
  }

  async updateWorkspace(
    id: string | number,
    name: string,
    description?: string
  ): Promise<void> {
    const db = getDb();
    await db.run(
      `UPDATE workspaces SET name = ?, description = ?, updatedAt = ? WHERE id = ?`,
      name,
      description || null,
      new Date().toISOString(),
      String(id)
    );
    this.refresh();
  }

  async deleteWorkspace(id: string | number): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM workspaces WHERE id = ?`, String(id));
    if (this.activeWorkspaceId === id || String(this.activeWorkspaceId) === String(id)) {
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

