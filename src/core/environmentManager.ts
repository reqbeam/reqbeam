import { getDb } from "../extension/db";
import { generateId } from "../utils/cuid";

export interface Environment {
  id: string;
  name: string;
  workspaceId?: string | null;
  userId: string;
  variables: string; // JSON-encoded { key: value }
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  id: string;
  envId: string;
  key: string;
  value: string;
}

export class EnvironmentManager {
  /**
   * Get all environments, optionally filtered by workspace and userId
   */
  async getEnvironments(workspaceId?: string | null, userId?: string | null): Promise<Environment[]> {
    const db = getDb();
    
    // If no userId provided, return empty array (user must be logged in)
    if (!userId) {
      return [];
    }
    
    if (workspaceId != null) {
      const rows = await db.all<Environment[]>(
        `SELECT id, name, workspaceId, userId, variables, isActive, createdAt, updatedAt FROM environments WHERE workspaceId = ? AND userId = ? ORDER BY name ASC`,
        workspaceId,
        userId
      );
      return rows;
    }
    const rows = await db.all<Environment[]>(
      `SELECT id, name, workspaceId, userId, variables, isActive, createdAt, updatedAt FROM environments WHERE userId = ? ORDER BY name ASC`,
      userId
    );
    return rows;
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string): Promise<Environment | null> {
    const db = getDb();
    const row = await db.get<Environment>(
      `SELECT id, name, workspaceId, userId, variables, isActive, createdAt, updatedAt FROM environments WHERE id = ?`,
      id
    );
    return row ?? null;
  }

  /**
   * Create a new environment
   */
  async createEnvironment(
    name: string,
    workspaceId?: string | null,
    userId?: string | null
  ): Promise<string> {
    const db = getDb();
    if (!userId) {
      throw new Error("User must be logged in to create environments");
    }
    const id = generateId();
    const now = new Date().toISOString();
    await db.run(
      `INSERT INTO environments (id, name, workspaceId, userId, variables, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      name,
      workspaceId ?? null,
      userId,
      '{}',
      0,
      now,
      now
    );
    return id;
  }

  /**
   * Update environment metadata (name, workspaceId)
   */
  async updateEnvironment(
    id: string,
    data: { name?: string; workspaceId?: string | null }
  ): Promise<void> {
    const db = getDb();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.workspaceId !== undefined) {
      updates.push("workspaceId = ?");
      values.push(data.workspaceId);
    }

    if (updates.length === 0) return;

    const now = new Date().toISOString();
    updates.push("updatedAt = ?");
    values.push(now);
    values.push(id);
    await db.run(
      `UPDATE environments SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  }

  /**
   * Delete an environment
   */
  async deleteEnvironment(id: string): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM environments WHERE id = ?`, id);
  }

  /**
   * Duplicate an environment with all its variables
   */
  async duplicateEnvironment(
    id: string,
    newName: string,
    userId?: string | null
  ): Promise<string> {
    const env = await this.getEnvironment(id);
    if (!env) {
      throw new Error(`Environment with id ${id} not found`);
    }

    if (!userId) {
      throw new Error("User must be logged in to duplicate environments");
    }

    const variables = await this.getVariables(id);
    const newEnvId = await this.createEnvironment(newName, env.workspaceId ?? null, userId);

    // Copy all variables
    for (const variable of variables) {
      await this.setVariable(newEnvId, variable.key, variable.value);
    }

    return newEnvId;
  }

  /**
   * Get all variables for an environment (parsed from JSON)
   */
  async getVariables(envId: string): Promise<EnvironmentVariable[]> {
    const env = await this.getEnvironment(envId);
    if (!env) {
      return [];
    }

    try {
      const varsMap = JSON.parse(env.variables || '{}') as Record<string, string>;
      return Object.entries(varsMap).map(([key, value], index) => ({
        id: `${envId}-${index}`,
        envId,
        key,
        value,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Set a variable in an environment (updates JSON)
   */
  async setVariable(
    envId: string,
    key: string,
    value: string
  ): Promise<string> {
    const db = getDb();
    const env = await this.getEnvironment(envId);
    if (!env) {
      throw new Error(`Environment with id ${envId} not found`);
    }

    try {
      const varsMap = JSON.parse(env.variables || '{}') as Record<string, string>;
      varsMap[key] = value;
      const now = new Date().toISOString();
      await db.run(
        `UPDATE environments SET variables = ?, updatedAt = ? WHERE id = ?`,
        JSON.stringify(varsMap),
        now,
        envId
      );
      return `${envId}-${key}`;
    } catch (error) {
      throw new Error(`Failed to set variable: ${error}`);
    }
  }

  /**
   * Remove a variable by key
   */
  async removeVariableByKey(envId: string, key: string): Promise<void> {
    const db = getDb();
    const env = await this.getEnvironment(envId);
    if (!env) {
      throw new Error(`Environment with id ${envId} not found`);
    }

    try {
      const varsMap = JSON.parse(env.variables || '{}') as Record<string, string>;
      delete varsMap[key];
      const now = new Date().toISOString();
      await db.run(
        `UPDATE environments SET variables = ?, updatedAt = ? WHERE id = ?`,
        JSON.stringify(varsMap),
        now,
        envId
      );
    } catch (error) {
      throw new Error(`Failed to remove variable: ${error}`);
    }
  }

  /**
   * Remove a variable by ID (for compatibility, finds by key)
   */
  async removeVariable(varId: string): Promise<void> {
    // varId format is "envId-key" or just key
    const parts = varId.split('-');
    if (parts.length >= 2) {
      const envId = parts[0];
      const key = parts.slice(1).join('-');
      await this.removeVariableByKey(envId, key);
    }
  }

  /**
   * Get all variables as a key-value map for an environment
   */
  async getVariablesMap(envId: string | null): Promise<Record<string, string>> {
    if (!envId) return {};

    const env = await this.getEnvironment(envId);
    if (!env) return {};

    try {
      return JSON.parse(env.variables || '{}') as Record<string, string>;
    } catch {
      return {};
    }
  }

  /**
   * Resolve variables in text using the specified environment
   */
  async resolveVariables(
    text: string,
    envId: string | null
  ): Promise<string> {
    if (!text || !envId) return text;

    const variables = await this.getVariablesMap(envId);
    const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

    return text.replace(VARIABLE_REGEX, (match, key: string) => {
      if (Object.prototype.hasOwnProperty.call(variables, key)) {
        return variables[key] ?? "";
      }
      // Return unchanged if variable not found
      return match;
    });
  }

  /**
   * Resolve variables in an object (for request payloads)
   */
  async resolveRequestVariables<T extends Record<string, unknown>>(
    request: T,
    envId: string | null
  ): Promise<T> {
    if (!envId) return request;

    const variables = await this.getVariablesMap(envId);
    const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

    const resolve = (value: unknown): unknown => {
      if (typeof value === "string") {
        return value.replace(VARIABLE_REGEX, (match, key: string) => {
          if (Object.prototype.hasOwnProperty.call(variables, key)) {
            return variables[key] ?? "";
          }
          return match;
        });
      } else if (Array.isArray(value)) {
        return value.map(resolve);
      } else if (value && typeof value === "object") {
        const resolved: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          resolved[k] = resolve(v);
        }
        return resolved;
      }
      return value;
    };

    return resolve(request) as T;
  }
}
