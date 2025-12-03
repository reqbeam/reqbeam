import * as vscode from "vscode";
import { getDb } from "./db";
import { Collection, RequestModel } from "../types/models";
import { WorkspaceService } from "./workspaceService";

export interface CollectionTreeItem extends vscode.TreeItem {
  contextValue: "workspace" | "collection" | "request";
  workspaceId?: number;
  collectionId?: number;
  requestId?: number;
}

export class CollectionService implements vscode.TreeDataProvider<CollectionTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private workspaceService: WorkspaceService;

  constructor(workspaceService: WorkspaceService) {
    this.workspaceService = workspaceService;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async getCollections(workspaceId?: number | null): Promise<Collection[]> {
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

  async getRequestsForCollection(collectionId: number): Promise<RequestModel[]> {
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

  async getRequestsForWorkspace(workspaceId: number): Promise<RequestModel[]> {
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
    workspaceId?: number | null,
    description?: string
  ): Promise<number> {
    const db = getDb();
    const result = await db.run(
      `INSERT INTO collections (name, workspaceId, description) VALUES (?, ?, ?)`,
      name,
      workspaceId ?? null,
      description || null
    );
    const id = result.lastID ?? 0;
    this.refresh();
    return id;
  }

  async saveRequest(model: Omit<RequestModel, "id"> & { id?: number }): Promise<number> {
    const db = getDb();
    if (model.id) {
      await db.run(
        `UPDATE requests
         SET collectionId = ?, workspaceId = ?, name = ?, method = ?, url = ?, headers = ?, body = ?, bodyType = ?, auth = ?
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
        model.id
      );
      this.refresh();
      return model.id;
    }

    const result = await db.run(
      `INSERT INTO requests (collectionId, workspaceId, name, method, url, headers, body, bodyType, auth)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      model.collectionId ?? null,
      model.workspaceId ?? null,
      model.name,
      model.method,
      model.url,
      model.headers,
      model.body,
      model.bodyType || null,
      model.auth || null
    );
    const id = result.lastID ?? 0;
    this.refresh();
    return id;
  }

  async getRequestById(id: number): Promise<RequestModel | null> {
    const db = getDb();
    const row = await db.get<RequestModel>(
      `SELECT id, collectionId, workspaceId, name, method, url, headers, body, bodyType, auth
       FROM requests
       WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  async renameRequest(id: number, name: string): Promise<void> {
    const db = getDb();
    await db.run(`UPDATE requests SET name = ? WHERE id = ?`, name, id);
    this.refresh();
  }

  async deleteRequest(id: number): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM requests WHERE id = ?`, id);
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
      const collections = await this.getCollections(activeWorkspaceId);
      const requests = await this.getRequestsForWorkspace(activeWorkspaceId);
      
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
      const collections = await this.getCollections(element.workspaceId);
      const requests = await this.getRequestsForWorkspace(element.workspaceId);
      
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
      const requests = await this.getRequestsForCollection(element.collectionId);
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


