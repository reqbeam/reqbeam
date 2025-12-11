import { getDb } from "../extension/db";
import * as crypto from "crypto";

export interface User {
  id?: number;
  email: string;
  name: string;
  passwordHash: string;
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
 * Create a new user
 */
export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<{ id: number; email: string; name: string }> {
  const db = getDb();

  // Check if user already exists
  const existing = await db.get<{ id: number }>(
    `SELECT id FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );

  if (existing) {
    throw new Error("Email already exists");
  }

  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  const result = await db.run(
    `INSERT INTO users (email, name, passwordHash, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
    email.toLowerCase().trim(),
    name.trim(),
    passwordHash,
    now,
    now
  );

  if (!result.lastID) {
    throw new Error("Failed to create user");
  }

  return {
    id: result.lastID,
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
): Promise<{ id: number; email: string; name: string } | null> {
  const db = getDb();

  const user = await db.get<User>(
    `SELECT id, email, name, passwordHash FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return {
    id: user.id!,
    email: user.email,
    name: user.name,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  const db = getDb();
  const user = await db.get<User>(
    `SELECT id, email, name, passwordHash, createdAt, updatedAt FROM users WHERE id = ?`,
    id
  );
  return user || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDb();
  const user = await db.get<User>(
    `SELECT id, email, name, passwordHash, createdAt, updatedAt FROM users WHERE email = ?`,
    email.toLowerCase().trim()
  );
  return user || null;
}

/**
 * Generate a simple JWT-like token for local storage
 * This is a simple implementation - in production, use a proper JWT library
 */
export function generateToken(userId: number, email: string): string {
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
export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

