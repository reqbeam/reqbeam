import { getDb } from "../extension/db";
import { RequestAuth, AuthType } from "../types/models";

/**
 * Get auth config for a request
 */
export async function getAuth(requestId: number): Promise<RequestAuth | null> {
  const db = getDb();
  const row = await db.get<{
    id: number;
    requestId: number;
    type: string;
    key: string | null;
    value: string | null;
    username: string | null;
    password: string | null;
    in_location: string | null;
    headerName: string | null;
    headerValue: string | null;
  }>(
    `SELECT id, requestId, type, key, value, username, password, in_location, headerName, headerValue
     FROM request_auth WHERE requestId = ?`,
    requestId
  );

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    requestId: row.requestId,
    type: row.type as AuthType,
    key: row.key || undefined,
    value: row.value || undefined,
    username: row.username || undefined,
    password: row.password || undefined,
    in_location: (row.in_location as "header" | "query") || undefined,
    headerName: row.headerName || undefined,
    headerValue: row.headerValue || undefined,
  };
}

/**
 * Save or update auth config for a request
 */
export async function saveAuth(
  requestId: number,
  auth: Omit<RequestAuth, "id" | "requestId">
): Promise<void> {
  const db = getDb();

  // For basic auth, encode password as base64 for storage
  let password = auth.password;
  if (auth.type === "basic" && auth.password && auth.username) {
    // Check if already base64 encoded (basic check)
    try {
      // Try to decode - if it fails, it's not base64, so encode it
      Buffer.from(auth.password, "base64").toString("utf-8");
      // If decode succeeds, it might already be encoded, but we'll store as-is
      // Actually, let's always store the plain password and encode on use
      password = auth.password; // Store plain, encode in requestBuilder
    } catch {
      // Not base64, store as-is (will be encoded in requestBuilder)
      password = auth.password;
    }
  }

  // Check if auth exists
  const existing = await db.get<{ id: number }>(
    `SELECT id FROM request_auth WHERE requestId = ?`,
    requestId
  );

  if (existing) {
    // Update existing
    await db.run(
      `UPDATE request_auth 
       SET type = ?, key = ?, value = ?, username = ?, password = ?, in_location = ?, headerName = ?, headerValue = ?
       WHERE requestId = ?`,
      auth.type,
      auth.key || null,
      auth.value || null,
      auth.username || null,
      password || null,
      auth.in_location || null,
      auth.headerName || null,
      auth.headerValue || null,
      requestId
    );
  } else {
    // Insert new
    await db.run(
      `INSERT INTO request_auth (requestId, type, key, value, username, password, in_location, headerName, headerValue)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      requestId,
      auth.type,
      auth.key || null,
      auth.value || null,
      auth.username || null,
      password || null,
      auth.in_location || null,
      auth.headerName || null,
      auth.headerValue || null
    );
  }
}

/**
 * Delete auth config for a request
 */
export async function deleteAuth(requestId: number): Promise<void> {
  const db = getDb();
  await db.run(`DELETE FROM request_auth WHERE requestId = ?`, requestId);
}

/**
 * Set auth to "none" (reset)
 */
export async function resetAuth(requestId: number): Promise<void> {
  await saveAuth(requestId, { type: "none" });
}

