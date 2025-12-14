import * as vscode from "vscode";
import { getDb } from "./db";
import { Collection, RequestModel } from "../types/models";
import { WorkspaceService } from "./workspaceService";
import { generateId } from "../utils/cuid";
import { AuthManager } from "../auth/authManager";

export interface CollectionTreeItem extends vscode.TreeItem {
  contextValue: "workspace" | "collection" | "request";
  workspaceId?: string;
  collectionId?: string;
  requestId?: string;
}

export class CollectionService implements vscode.TreeDataProvider<CollectionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private workspaceService: WorkspaceService;
  private authManager?: AuthManager;

  constructor(workspaceService: WorkspaceService, authManager?: AuthManager) {
    this.workspaceService = workspaceService;
    this.authManager = authManager;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async getCollections(workspaceId?: string | null): Promise<Collection[]> {
    const db = getDb();
    if (workspaceId != null) {
      const rows = await db.all<Collection[]>(
        `SELECT id, name, workspaceId, description FROM collections WHERE workspaceId = ? ORDER BY id ASC`,
        workspaceId
      );
      return rows;
    }
    const rows = await db.all<Collection[]>(
      `SELECT id, name, workspaceId, description FROM collections ORDER BY id ASC`
    );
    return rows;
  }

  async getRequestsForCollection(collectionId: string): Promise<RequestModel[]> {
    const db = getDb();
    const rows = await db.all<RequestModel[]>(
      `SELECT id, collectionId, workspaceId, name, method, url, headers, body, bodyType, auth
       FROM requests
       WHERE collectionId = ?
       ORDER BY id DESC`,
      collectionId
    );
    return rows;
  }

  async getRequestsForWorkspace(workspaceId: string): Promise<RequestModel[]> {
    const db = getDb();
    const rows = await db.all<RequestModel[]>(
      `SELECT id, collectionId, workspaceId, name, method, url, headers, body, bodyType, auth
       FROM requests
       WHERE workspaceId = ? AND collectionId IS NULL
       ORDER BY id DESC`,
      workspaceId
    );
    return rows;
  }

  async createCollection(
    name: string,
    workspaceId?: string | number | null,
    description?: string
  ): Promise<string> {
    const db = getDb();
    
    // Get user info from auth token
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
      throw new Error("User must be logged in to create collections");
    }

    // Ensure user exists in local database (sync if needed)
    // This prevents foreign key constraint errors
    if (tokenUserId && userEmail) {
      try {
        const { createOrUpdateUserFromAuth } = await import("../storage/users");
        await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
      } catch (error) {
        console.error("Error syncing user before creating collection:", error);
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

    // Generate CUID for ID
    const id = generateId();
    const now = new Date().toISOString();
    
    // Convert workspaceId to string if it's a number (for backward compatibility during migration)
    const workspaceIdStr = workspaceId ? String(workspaceId) : null;
    
    await db.run(
      `INSERT INTO collections (id, name, userId, workspaceId, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      userId,
      workspaceIdStr,
      description || null,
      now,
      now
    );
    
    this.refresh();
    return id;
  }

  async saveRequest(model: Omit<RequestModel, "id"> & { id?: string }): Promise<string> {
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
      throw new Error("User must be logged in to save requests");
    }

    // Ensure user exists in local database (sync if needed)
    if (tokenUserId && userEmail) {
      try {
        const { createOrUpdateUserFromAuth } = await import("../storage/users");
        await createOrUpdateUserFromAuth(tokenUserId, userEmail, userName);
      } catch (error) {
        console.error("Error syncing user before saving request:", error);
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

    if (model.id) {
      const now = new Date().toISOString();
      await db.run(
        `UPDATE requests
         SET collectionId = ?, workspaceId = ?, name = ?, method = ?, url = ?, headers = ?, body = ?, bodyType = ?, auth = ?, updatedAt = ?
         WHERE id = ?`,
        model.collectionId ?? null,
        model.workspaceId ?? null,
        model.name,
        model.method,
        model.url,
        model.headers,
        model.body,
        model.bodyType || null,
        model.auth || null,
        now,
        model.id
      );
      this.refresh();
      return model.id;
    }

    // Create new request
    const id = generateId();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO requests (id, collectionId, workspaceId, userId, name, method, url, headers, body, bodyType, auth, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      model.collectionId ?? null,
      model.workspaceId ?? null,
      userId,
      model.name,
      model.method,
      model.url,
      model.headers,
      model.body,
      model.bodyType || null,
      model.auth || null,
      now,
      now
    );
    this.refresh();
    return id;
  }

  async getRequestById(id: string): Promise<RequestModel | null> {
    const db = getDb();
    const row = await db.get<RequestModel>(
      `SELECT id, collectionId, workspaceId, name, method, url, headers, body, bodyType, auth
       FROM requests
       WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  async renameRequest(id: string, name: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.run(`UPDATE requests SET name = ?, updatedAt = ? WHERE id = ?`, name, now, id);
    this.refresh();
  }

  async deleteRequest(id: string): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM requests WHERE id = ?`, id);
    this.refresh();
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    const db = getDb();
    const row = await db.get<Collection>(
      `SELECT id, name, workspaceId, description FROM collections WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  async renameCollection(id: string, name: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.run(`UPDATE collections SET name = ?, updatedAt = ? WHERE id = ?`, name, now, id);
    this.refresh();
  }

  async deleteCollection(id: string): Promise<void> {
    const db = getDb();
    // First delete all requests in this collection
    await db.run(`DELETE FROM requests WHERE collectionId = ?`, id);
    // Then delete the collection
    await db.run(`DELETE FROM collections WHERE id = ?`, id);
    this.refresh();
  }

  getTreeItem(element: CollectionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CollectionTreeItem): Promise<CollectionTreeItem[]> {
    if (!element) {
      // Show workspaces at root level
      const workspaces = await this.workspaceService.getWorkspaces();
      const activeWorkspaceId = this.workspaceService.getActiveWorkspaceId();
      
      // If no active workspace, show all workspaces
      if (activeWorkspaceId == null) {
        return workspaces.map((w) => {
          const item = new vscode.TreeItem(
            w.name,
            vscode.TreeItemCollapsibleState.Collapsed
          ) as CollectionTreeItem;
          item.contextValue = "workspace";
          item.workspaceId = w.id;
          return item;
        });
      }

      // Show collections and requests for active workspace
      const workspaceIdStr = activeWorkspaceId != null ? String(activeWorkspaceId) : null;
      const collections = await this.getCollections(workspaceIdStr);
      const requests = workspaceIdStr ? await this.getRequestsForWorkspace(workspaceIdStr) : [];
      
      const items: CollectionTreeItem[] = [];
      
      // Add collections
      for (const c of collections) {
        const item = new vscode.TreeItem(
          c.name,
          vscode.TreeItemCollapsibleState.Collapsed
        ) as CollectionTreeItem;
        item.contextValue = "collection";
        item.collectionId = c.id;
        item.workspaceId = c.workspaceId ?? undefined;
        items.push(item);
      }
      
      // Add standalone requests (not in collections)
      for (const r of requests) {
        const item = new vscode.TreeItem(
          r.name || `${r.method} ${r.url}`,
          vscode.TreeItemCollapsibleState.None
        ) as CollectionTreeItem;
        item.contextValue = "request";
        item.requestId = r.id;
        item.workspaceId = r.workspaceId ?? undefined;
        item.tooltip = r.name || `${r.method} ${r.url}`;
        // Store request data for context menu commands
        (item as any).requestName = r.name;
        item.command = {
          command: "reqbeam.loadRequest",
          title: "ReqBeam: Load Request",
          arguments: [r],
        };
        items.push(item);
      }
      
      return items;
    }

    if (element.contextValue === "workspace" && element.workspaceId != null) {
      const workspaceIdStr = String(element.workspaceId);
      const collections = await this.getCollections(workspaceIdStr);
      const requests = await this.getRequestsForWorkspace(workspaceIdStr);
      
      const items: CollectionTreeItem[] = [];
      
      for (const c of collections) {
        const item = new vscode.TreeItem(
          c.name,
          vscode.TreeItemCollapsibleState.Collapsed
        ) as CollectionTreeItem;
        item.contextValue = "collection";
        item.collectionId = c.id;
        item.workspaceId = c.workspaceId ?? undefined;
        items.push(item);
      }
      
      for (const r of requests) {
        const item = new vscode.TreeItem(
          r.name || `${r.method} ${r.url}`,
          vscode.TreeItemCollapsibleState.None
        ) as CollectionTreeItem;
        item.contextValue = "request";
        item.requestId = r.id;
        item.workspaceId = r.workspaceId ?? undefined;
        item.tooltip = r.name || `${r.method} ${r.url}`;
        // Store request data for context menu commands
        (item as any).requestName = r.name;
        item.command = {
          command: "reqbeam.loadRequest",
          title: "ReqBeam: Load Request",
          arguments: [r],
        };
        items.push(item);
      }
      
      return items;
    }

    if (element.contextValue === "collection" && element.collectionId != null) {
      const collectionIdStr = String(element.collectionId);
      const requests = await this.getRequestsForCollection(collectionIdStr);
      return requests.map((r) => {
        const item = new vscode.TreeItem(
          r.name || `${r.method} ${r.url}`,
          vscode.TreeItemCollapsibleState.None
        ) as CollectionTreeItem;
        item.contextValue = "request";
        item.requestId = r.id;
        item.workspaceId = r.workspaceId ?? undefined;
        item.tooltip = r.name || `${r.method} ${r.url}`;
        // Store request data for context menu commands
        (item as any).requestName = r.name;
        item.command = {
          command: "reqbeam.loadRequest",
          title: "ReqBeam: Load Request",
          arguments: [r],
        };
        return item;
      });
    }

    return [];
  }
}


