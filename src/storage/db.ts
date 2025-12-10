import * as vscode from "vscode";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../extension/db";
import { Collection, RequestModel } from "../types/models";
import { parseOpenAPISpec } from "../core/swaggerParser";

export interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    _postman_id?: string;
    schema: string;
  };
  item: PostmanItem[];
}

export interface PostmanItem {
  name: string;
  request?: {
    method: string;
    header?: Array<{ key: string; value: string; disabled?: boolean }>;
    url?: {
      raw?: string;
      host?: string[];
      path?: string[];
      query?: Array<{ key: string; value: string; disabled?: boolean }>;
    };
    body?: {
      mode: string;
      raw?: string;
      formdata?: Array<{ key: string; value: string }>;
      urlencoded?: Array<{ key: string; value: string }>;
    };
    auth?: any;
    description?: string;
  };
  item?: PostmanItem[];
}

export interface ReqBeamCollection {
  name: string;
  description?: string;
  requests: Array<{
    id?: string;
    name: string;
    method: string;
    url: string;
    headers?: Array<{ key: string; value: string; enabled?: boolean }>;
    body?: string;
    params?: Array<{ key: string; value: string; enabled?: boolean }>;
    auth?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

/**
 * Get all collections for a workspace
 */
export async function getCollections(
  workspaceId: number | null
): Promise<Collection[]> {
  const db = getDb();
  if (workspaceId != null) {
    return await db.all<Collection[]>(
      `SELECT id, name, workspaceId, description FROM collections WHERE workspaceId = ? ORDER BY id ASC`,
      workspaceId
    );
  }
  return await db.all<Collection[]>(
    `SELECT id, name, workspaceId, description FROM collections ORDER BY id ASC`
  );
}

/**
 * Get a single collection with its requests
 */
export async function getCollectionWithRequests(
  collectionId: number
): Promise<{ collection: Collection; requests: RequestModel[] } | null> {
  const db = getDb();
  const collection = await db.get<Collection>(
    `SELECT id, name, workspaceId, description FROM collections WHERE id = ?`,
    collectionId
  );

  if (!collection) {
    return null;
  }

  const requests = await db.all<RequestModel[]>(
    `SELECT id, collectionId, workspaceId, name, method, url, headers, body, bodyType, auth
     FROM requests
     WHERE collectionId = ?
     ORDER BY id ASC`,
    collectionId
  );

  return { collection, requests };
}

/**
 * Save a collection to database
 */
export async function saveCollection(
  name: string,
  workspaceId: number | null,
  description?: string
): Promise<number> {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO collections (name, workspaceId, description) VALUES (?, ?, ?)`,
    name,
    workspaceId ?? null,
    description || null
  );
  return result.lastID ?? 0;
}

/**
 * Export collection to Postman v2.1 format
 */
export async function exportCollection(
  collectionId: number,
  exportAll: boolean = false
): Promise<string> {
  const db = getDb();

  if (exportAll) {
    // Export all collections
    const collections = await getCollections(null);
    const allItems: any[] = [];

    for (const collection of collections) {
      const data = await getCollectionWithRequests(collection.id);
      if (data) {
        const items = convertRequestsToPostmanItems(data.requests);
        allItems.push({
          name: collection.name,
          description: collection.description || "",
          item: items,
        });
      }
    }

    const exportData: PostmanCollection = {
      info: {
        name: "ReqBeam Collections",
        _postman_id: uuidv4(),
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: allItems,
    };

    return JSON.stringify(exportData, null, 2);
  } else {
    // Export single collection
    const data = await getCollectionWithRequests(collectionId);
    if (!data) {
      throw new Error("Collection not found");
    }

    const items = convertRequestsToPostmanItems(data.requests);

    const exportData: PostmanCollection = {
      info: {
        name: data.collection.name,
        description: data.collection.description || "",
        _postman_id: uuidv4(),
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: items,
    };

    return JSON.stringify(exportData, null, 2);
  }
}

/**
 * Convert ReqBeam requests to Postman items
 */
function convertRequestsToPostmanItems(
  requests: RequestModel[]
): PostmanItem[] {
  return requests.map((req) => {
    // Parse headers
    let headers: Array<{ key: string; value: string; disabled?: boolean }> =
      [];
    try {
      const parsed = JSON.parse(req.headers || "[]");
      if (Array.isArray(parsed)) {
        headers = parsed
          .filter((h: any) => h.enabled !== false)
          .map((h: any) => ({
            key: h.key || "",
            value: h.value || "",
            disabled: h.enabled === false,
          }));
      }
    } catch {
      // If parsing fails, use empty array
    }

    // Parse body
    let body: any = undefined;
    if (req.body) {
      if (req.bodyType === "form-data") {
        try {
          const formData = JSON.parse(req.body);
          body = {
            mode: "formdata",
            formdata: Object.entries(formData).map(([key, value]) => ({
              key,
              value: String(value),
            })),
          };
        } catch {
          body = {
            mode: "raw",
            raw: req.body,
          };
        }
      } else if (req.bodyType === "x-www-form-urlencoded") {
        try {
          const urlEncoded = JSON.parse(req.body);
          body = {
            mode: "urlencoded",
            urlencoded: Object.entries(urlEncoded).map(([key, value]) => ({
              key,
              value: String(value),
            })),
          };
        } catch {
          body = {
            mode: "raw",
            raw: req.body,
          };
        }
      } else {
        body = {
          mode: "raw",
          raw: req.body,
        };
      }
    }

    // Parse auth if available
    let auth: any = undefined;
    if (req.auth) {
      try {
        auth = JSON.parse(req.auth);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      name: req.name,
      request: {
        method: req.method,
        header: headers.length > 0 ? headers : undefined,
        url: {
          raw: req.url,
        },
        body: body,
        auth: auth,
      },
    };
  });
}

/**
 * Import Postman collection
 */
export async function importCollection(
  filePath: string,
  workspaceId: number | null
): Promise<{ collectionId: number; requestCount: number }> {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  let data: any;

  try {
    data = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Invalid JSON file: ${error}`);
  }

  // Detect format
  const isPostman =
    data.info &&
    data.info.schema &&
    data.info.schema.includes("collection/v");

  if (isPostman) {
    return await importPostmanCollection(data as PostmanCollection, workspaceId);
  } else {
    // Assume ReqBeam format
    return await importReqBeamCollection(data as ReqBeamCollection, workspaceId);
  }
}

/**
 * Import Postman collection format
 */
async function importPostmanCollection(
  data: PostmanCollection,
  workspaceId: number | null
): Promise<{ collectionId: number; requestCount: number }> {
  const db = getDb();

  // Check for duplicate name
  let collectionName = data.info.name;
  const existing = await db.get<{ id: number }>(
    `SELECT id FROM collections WHERE name = ? AND (workspaceId = ? OR (? IS NULL AND workspaceId IS NULL))`,
    collectionName,
    workspaceId,
    workspaceId
  );

  if (existing) {
    collectionName = `${collectionName} (Imported)`;
  }

  // Create collection
  const collectionId = await saveCollection(
    collectionName,
    workspaceId,
    data.info.description
  );

  // Process items recursively
  let requestCount = 0;
  async function processItems(items: PostmanItem[]) {
    for (const item of items) {
      if (item.request) {
        // It's a request
        const request = item.request;
        const method = (request.method || "GET").toUpperCase();

        // Build URL
        let url = "";
        if (request.url) {
          if (typeof request.url === "string") {
            url = request.url;
          } else if (request.url.raw) {
            url = request.url.raw;
          } else {
            const host = request.url.host?.join(".") || "";
            const path = request.url.path?.join("/") || "";
            url = `${host ? "https://" + host : ""}${path ? "/" + path : ""}`;
          }
        }

        // Build headers
        const headers: Array<{ key: string; value: string; enabled?: boolean }> =
          [];
        if (request.header) {
          for (const header of request.header) {
            if (header.key && !header.disabled) {
              headers.push({
                key: header.key,
                value: header.value || "",
                enabled: true,
              });
            }
          }
        }

        // Build body
        let body = "";
        let bodyType = "json";
        if (request.body) {
          if (request.body.mode === "raw") {
            body = request.body.raw || "";
            bodyType = "json";
          } else if (
            request.body.mode === "formdata" &&
            request.body.formdata
          ) {
            bodyType = "form-data";
            const formData: Record<string, string> = {};
            for (const item of request.body.formdata) {
              if (item.key) {
                formData[item.key] = item.value || "";
              }
            }
            body = JSON.stringify(formData);
          } else if (
            request.body.mode === "urlencoded" &&
            request.body.urlencoded
          ) {
            bodyType = "x-www-form-urlencoded";
            const urlEncoded: Record<string, string> = {};
            for (const item of request.body.urlencoded) {
              if (item.key) {
                urlEncoded[item.key] = item.value || "";
              }
            }
            body = JSON.stringify(urlEncoded);
          }
        }

        // Save request
        await db.run(
          `INSERT INTO requests (collectionId, workspaceId, name, method, url, headers, body, bodyType, auth)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          collectionId,
          workspaceId,
          item.name || `${method} ${url}`,
          method,
          url,
          JSON.stringify(headers),
          body,
          bodyType,
          request.auth ? JSON.stringify(request.auth) : null
        );
        requestCount++;
      } else if (item.item) {
        // It's a folder, recursively process
        await processItems(item.item);
      }
    }
  }

  if (data.item) {
    await processItems(data.item);
  }

  return { collectionId, requestCount };
}

/**
 * Import ReqBeam collection format
 */
async function importReqBeamCollection(
  data: ReqBeamCollection,
  workspaceId: number | null
): Promise<{ collectionId: number; requestCount: number }> {
  const db = getDb();

  // Check for duplicate name
  let collectionName = data.name;
  const existing = await db.get<{ id: number }>(
    `SELECT id FROM collections WHERE name = ? AND (workspaceId = ? OR (? IS NULL AND workspaceId IS NULL))`,
    collectionName,
    workspaceId,
    workspaceId
  );

  if (existing) {
    collectionName = `${collectionName} (Imported)`;
  }

  // Create collection
  const collectionId = await saveCollection(
    collectionName,
    workspaceId,
    data.description
  );

  // Import requests
  let requestCount = 0;
  for (const req of data.requests) {
    await db.run(
      `INSERT INTO requests (collectionId, workspaceId, name, method, url, headers, body, bodyType, auth)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      collectionId,
      workspaceId,
      req.name,
      req.method,
      req.url,
      JSON.stringify(req.headers || []),
      req.body || "",
      "json",
      req.auth || null
    );
    requestCount++;
  }

  return { collectionId, requestCount };
}

/**
 * Import Swagger/OpenAPI spec
 */
export async function importSwagger(
  filePath: string,
  workspaceId: number | null
): Promise<{ collectionId: number; requestCount: number }> {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const fileName = filePath.toLowerCase();
  const fileType = fileName.endsWith(".yaml") || fileName.endsWith(".yml")
    ? "yaml"
    : "json";

  // Parse OpenAPI spec
  const requests = parseOpenAPISpec(fileContent, fileType);

  // Parse to get collection name
  let collectionName = "Imported API";
  try {
    const spec =
      fileType === "yaml"
        ? yaml.load(fileContent)
        : JSON.parse(fileContent);
    if (spec.info?.title) {
      collectionName = `${spec.info.title} API (Imported)`;
    }
  } catch {
    // Use default name
  }

  const db = getDb();

  // Check for duplicate name
  let finalCollectionName = collectionName;
  const existing = await db.get<{ id: number }>(
    `SELECT id FROM collections WHERE name = ? AND (workspaceId = ? OR (? IS NULL AND workspaceId IS NULL))`,
    finalCollectionName,
    workspaceId,
    workspaceId
  );

  if (existing) {
    finalCollectionName = `${collectionName} (Imported)`;
  }

  // Create collection
  const collectionId = await saveCollection(
    finalCollectionName,
    workspaceId,
    "Imported from OpenAPI/Swagger specification"
  );

  // Import requests
  let requestCount = 0;
  for (const req of requests) {
    await db.run(
      `INSERT INTO requests (collectionId, workspaceId, name, method, url, headers, body, bodyType, auth)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      collectionId,
      workspaceId,
      req.name,
      req.method,
      req.url,
      JSON.stringify(req.headers || []),
      req.body || "",
      req.bodyType || "json",
      null
    );
    requestCount++;
  }

  return { collectionId, requestCount };
}

