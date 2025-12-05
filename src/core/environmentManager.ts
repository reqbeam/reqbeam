import { getDb } from "../extension/db";

export interface Environment {
  id: string;
  name: string;
  workspaceId?: number | null;
}

export interface EnvironmentVariable {
  id: string;
  envId: string;
  key: string;
  value: string;
}

export class EnvironmentManager {
  /**
   * Get all environments, optionally filtered by workspace
   */
  async getEnvironments(workspaceId?: number | null): Promise<Environment[]> {
    const db = getDb();
    if (workspaceId != null) {
      const rows = await db.all<Environment[]>(
        `SELECT id, name, workspaceId FROM environments WHERE workspaceId = ? ORDER BY name ASC`,
        workspaceId
      );
      return rows.map((r) => ({ ...r, id: String(r.id) }));
    }
    const rows = await db.all<Environment[]>(
      `SELECT id, name, workspaceId FROM environments ORDER BY name ASC`
    );
    return rows.map((r) => ({ ...r, id: String(r.id) }));
  }

  /**
   * Get a single environment by ID
   */
  async getEnvironment(id: string): Promise<Environment | null> {
    const db = getDb();
    const row = await db.get<Environment>(
      `SELECT id, name, workspaceId FROM environments WHERE id = ?`,
      Number(id)
    );
    if (!row) return null;
    return { ...row, id: String(row.id) };
  }

  /**
   * Create a new environment
   */
  async createEnvironment(
    name: string,
    workspaceId?: number | null
  ): Promise<string> {
    const db = getDb();
    const result = await db.run(
      `INSERT INTO environments (name, workspaceId) VALUES (?, ?)`,
      name,
      workspaceId ?? null
    );
    return String(result.lastID ?? 0);
  }

  /**
   * Update environment metadata (name, workspaceId)
   */
  async updateEnvironment(
    id: string,
    data: { name?: string; workspaceId?: number | null }
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

    values.push(Number(id));
    await db.run(
      `UPDATE environments SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  }

  /**
   * Delete an environment and all its variables
   */
  async deleteEnvironment(id: string): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM environment_variables WHERE env_id = ?`, Number(id));
    await db.run(`DELETE FROM environments WHERE id = ?`, Number(id));
  }

  /**
   * Duplicate an environment with all its variables
   */
  async duplicateEnvironment(
    id: string,
    newName: string
  ): Promise<string> {
    const env = await this.getEnvironment(id);
    if (!env) {
      throw new Error(`Environment with id ${id} not found`);
    }

    const variables = await this.getVariables(id);
    const newEnvId = await this.createEnvironment(newName, env.workspaceId ?? null);

    // Copy all variables
    for (const variable of variables) {
      await this.setVariable(newEnvId, variable.key, variable.value);
    }

    return newEnvId;
  }

  /**
   * Get all variables for an environment
   */
  async getVariables(envId: string): Promise<EnvironmentVariable[]> {
    const db = getDb();
    const rows = await db.all<EnvironmentVariable[]>(
      `SELECT id, env_id as envId, key, value FROM environment_variables WHERE env_id = ? ORDER BY key ASC`,
      Number(envId)
    );
    return rows.map((r) => ({
      ...r,
      id: String(r.id),
      envId: String(r.envId),
    }));
  }

  /**
   * Set a variable in an environment (creates if doesn't exist, updates if exists)
   */
  async setVariable(
    envId: string,
    key: string,
    value: string
  ): Promise<string> {
    const db = getDb();

    // Check if variable already exists
    const existing = await db.get<{ id: number }>(
      `SELECT id FROM environment_variables WHERE env_id = ? AND key = ?`,
      Number(envId),
      key
    );

    if (existing) {
      // Update existing
      await db.run(
        `UPDATE environment_variables SET value = ? WHERE id = ?`,
        value,
        existing.id
      );
      return String(existing.id);
    } else {
      // Create new
      const result = await db.run(
        `INSERT INTO environment_variables (env_id, key, value) VALUES (?, ?, ?)`,
        Number(envId),
        key,
        value
      );
      return String(result.lastID ?? 0);
    }
  }

  /**
   * Remove a variable by ID
   */
  async removeVariable(varId: string): Promise<void> {
    const db = getDb();
    await db.run(`DELETE FROM environment_variables WHERE id = ?`, Number(varId));
  }

  /**
   * Remove a variable by environment ID and key
   */
  async removeVariableByKey(envId: string, key: string): Promise<void> {
    const db = getDb();
    await db.run(
      `DELETE FROM environment_variables WHERE env_id = ? AND key = ?`,
      Number(envId),
      key
    );
  }

  /**
   * Get all variables as a key-value map for an environment
   */
  async getVariablesMap(envId: string | null): Promise<Record<string, string>> {
    if (!envId) return {};

    const variables = await this.getVariables(envId);
    const map: Record<string, string> = {};
    for (const variable of variables) {
      map[variable.key] = variable.value;
    }
    return map;
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

