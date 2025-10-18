import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { Environment } from '../types.js';

export async function loadEnvironment(envFile?: string): Promise<Environment> {
  const env: Environment = {};

  // Load from process.env
  Object.assign(env, process.env);

  // Load from .env file if exists
  const defaultEnvPath = path.resolve(process.cwd(), '.env');
  if (await fs.pathExists(defaultEnvPath)) {
    const parsed = dotenv.parse(await fs.readFile(defaultEnvPath));
    Object.assign(env, parsed);
  }

  // Load from specified env file
  if (envFile) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (await fs.pathExists(envPath)) {
      const content = await fs.readFile(envPath, 'utf-8');
      
      // Try to parse as JSON first
      try {
        const jsonEnv = JSON.parse(content);
        Object.assign(env, jsonEnv);
      } catch {
        // Fall back to .env format
        const parsed = dotenv.parse(content);
        Object.assign(env, parsed);
      }
    } else {
      throw new Error(`Environment file not found: ${envFile}`);
    }
  }

  return env;
}

