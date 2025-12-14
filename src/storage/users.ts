import { getDb } from "../extension/db";
import * as crypto from "crypto";
import { generateId } from "../utils/cuid";

export interface User {
  id?: string;
  email: string;
  name: string;
  password?: string; // For OAuth users, password is null
  passwordHash?: string; // For local users
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hash password using SHA-256 (simple approach for local storage)
 * In production, consider using bcrypt or argon2
 */
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password against hash
 */
function verifyPassword(password: string, hash: string): boolean {
  const passwordHash = hashPassword(password);
  return passwordHash === hash;
}

/**
 * Create a new user (for local signup - uses CUID for ID)
 */
export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<{ id: string; email: string; name: string }> {
  const db = getDb();

  // Check if user already exists
  const existing = await db.get<{ id: string }>(
    `SELECT id FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );

  if (existing) {
    throw new Error("Email already exists");
  }

  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  const id = generateId(); // Use CUID for ID

  await db.run(
    `INSERT INTO users (id, email, name, password, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    email.toLowerCase().trim(),
    name.trim(),
    passwordHash,
    now,
    now
  );

  return {
    id,
    email: email.toLowerCase().trim(),
    name: name.trim(),
  };
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string } | null> {
  const db = getDb();

  const user = await db.get<User>(
    `SELECT id, email, name, password FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );

  if (!user || !user.id) {
    return null;
  }

  // Check if user has a password (OAuth users don't have passwords)
  if (!user.password) {
    return null; // OAuth users can't login with password
  }

  // Verify password (compare with stored hash)
  // For backward compatibility, check if it's a hash or plain password
  const storedPassword = user.password;
  const isHash = storedPassword.length === 64; // SHA-256 hash is 64 chars
  
  if (isHash) {
    // Old format: compare hash
    if (!verifyPassword(password, storedPassword)) {
      return null;
    }
  } else {
    // New format: direct comparison (not recommended, but for migration)
    if (password !== storedPassword) {
      return null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || email.split("@")[0],
  };
}

/**
 * Get user by ID (supports both string CUID and number for backward compatibility)
 */
export async function getUserById(id: string | number): Promise<User | null> {
  const db = getDb();
  const user = await db.get<User>(
    `SELECT id, email, name, password, createdAt, updatedAt FROM users WHERE id = ?`,
    String(id)
  );
  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const user = await db.get<User>(
    `SELECT id, email, name, password, createdAt, updatedAt FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );
  return user || null;
}

/**
 * Create or update user from auth server (for syncing users after login)
 * This ensures the user exists in the local database when logging in via auth server
 */
export async function createOrUpdateUserFromAuth(
  userId: string,
  email: string,
  name?: string
): Promise<{ id: string; email: string; name: string | null }> {
  const db = getDb();
  const now = new Date().toISOString();

  // Check if user already exists
  const existing = await db.get<{ id: string; name: string | null }>(
    `SELECT id, name FROM users WHERE id = ? OR email = ?`,
    userId,
    email.toLowerCase().trim()
  );

  if (existing) {
    // Update user if name is provided and different
    if (name && name.trim() !== existing.name) {
      await db.run(
        `UPDATE users SET name = ?, email = ?, updatedAt = ? WHERE id = ?`,
        name.trim(),
        email.toLowerCase().trim(),
        now,
        existing.id
      );
      return {
        id: existing.id,
        email: email.toLowerCase().trim(),
        name: name.trim(),
      };
    }
    // Update email if userId matches but email is different
    if (existing.id === userId) {
      await db.run(
        `UPDATE users SET email = ?, updatedAt = ? WHERE id = ?`,
        email.toLowerCase().trim(),
        now,
        userId
      );
    }
    return {
      id: existing.id,
      email: email.toLowerCase().trim(),
      name: existing.name,
    };
  }

  // Create new user (OAuth users don't have passwords)
  await db.run(
    `INSERT INTO users (id, email, name, password, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    userId,
    email.toLowerCase().trim(),
    name?.trim() || null,
    null, // No password for auth server users
    now,
    now
  );

  return {
    id: userId,
    email: email.toLowerCase().trim(),
    name: name?.trim() || null,
  };
}

/**
 * Generate a simple JWT-like token for local storage
 * This is a simple implementation - in production, use a proper JWT library
 */
export function generateToken(userId: string, email: string): string {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
  };
  
  // Simple base64 encoding (not secure, but fine for local storage)
  // In production, use proper JWT signing
  const token = Buffer.from(JSON.stringify(payload)).toString("base64");
  return token;
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      userId: String(payload.userId), // Ensure it's a string
      email: payload.email,
    };
  } catch {
    return null;
  }
}

