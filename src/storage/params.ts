import { getDb } from "../extension/db";
import { RequestParam } from "../types/models";

/**
 * Get all params for a request
 */
export async function getParams(requestId: number): Promise<RequestParam[]> {
  const db = getDb();
  const rows = await db.all<Array<{
    id: number;
    requestId: number;
    key: string;
    value: string;
    active: number;
  }>>(
    `SELECT id, requestId, key, value, active FROM request_params WHERE requestId = ? ORDER BY id ASC`,
    requestId
  );

  return rows.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    key: row.key,
    value: row.value,
    active: row.active === 1,
  }));
}

/**
 * Add a new param to a request
 */
export async function addParam(
  requestId: number,
  key: string,
  value: string,
  active: boolean = true
): Promise<number> {
  const db = getDb();

  // Check for duplicate active keys
  if (active) {
    const existing = await db.get<{ id: number }>(
      `SELECT id FROM request_params WHERE requestId = ? AND key = ? AND active = 1`,
      requestId,
      key
    );
    if (existing) {
      // Update existing instead of creating duplicate
      await db.run(
        `UPDATE request_params SET value = ? WHERE id = ?`,
        value,
        existing.id
      );
      return existing.id;
    }
  }

  const result = await db.run(
    `INSERT INTO request_params (requestId, key, value, active) VALUES (?, ?, ?, ?)`,
    requestId,
    key,
    value,
    active ? 1 : 0
  );

  return result.lastID ?? 0;
}

/**
 * Update an existing param
 */
export async function updateParam(
  id: number,
  key: string,
  value: string,
  active: boolean
): Promise<void> {
  const db = getDb();

  // Get the requestId to check for duplicates
  const param = await db.get<{ requestId: number; key: string }>(
    `SELECT requestId, key FROM request_params WHERE id = ?`,
    id
  );

  if (!param) {
    throw new Error("Param not found");
  }

  // If activating and key changed, check for duplicate active keys
  if (active && key !== param.key) {
    const existing = await db.get<{ id: number }>(
      `SELECT id FROM request_params WHERE requestId = ? AND key = ? AND active = 1 AND id != ?`,
      param.requestId,
      key,
      id
    );
    if (existing) {
      throw new Error(`Duplicate active key: ${key}`);
    }
  }

  await db.run(
    `UPDATE request_params SET key = ?, value = ?, active = ? WHERE id = ?`,
    key,
    value,
    active ? 1 : 0,
    id
  );
}

/**
 * Delete a param
 */
export async function deleteParam(id: number): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM request_params WHERE id = ?`, id);
}

/**
 * Delete all params for a request
 */
export async function deleteParamsByRequestId(requestId: number): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM request_params WHERE requestId = ?`, requestId);
}

/**
 * Bulk update params for a request (replace all)
 */
export async function setParams(
  requestId: number,
  params: Array<{ key: string; value: string; active: boolean }>
): Promise<void> {
  const db = getDb();

  // Delete existing params
  await deleteParamsByRequestId(requestId);

  // Insert new params
  for (const param of params) {
    if (param.key.trim()) {
      // Check for duplicate active keys
      if (param.active) {
        const existing = await db.get<{ id: number }>(
          `SELECT id FROM request_params WHERE requestId = ? AND key = ? AND active = 1`,
          requestId,
          param.key
        );
        if (existing) {
          // Update existing
          await db.run(
            `UPDATE request_params SET value = ? WHERE id = ?`,
            param.value,
            existing.id
          );
          continue;
        }
      }

      await db.run(
        `INSERT INTO request_params (requestId, key, value, active) VALUES (?, ?, ?, ?)`,
        requestId,
        param.key,
        param.value,
        param.active ? 1 : 0
      );
    }
  }
}


