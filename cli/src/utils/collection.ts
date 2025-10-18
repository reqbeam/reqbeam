import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { Collection } from '../types.js';

export async function loadCollection(filePath: string): Promise<Collection> {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  
  if (!(await fs.pathExists(resolvedPath))) {
    throw new Error(`Collection file not found: ${filePath}`);
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content) as Collection;
    } else {
      return JSON.parse(content) as Collection;
    }
  } catch (error: any) {
    throw new Error(`Failed to parse collection file: ${error.message}`);
  }
}

export function validateCollection(collection: Collection): void {
  if (!collection.name) {
    throw new Error('Collection must have a name');
  }

  if (!Array.isArray(collection.requests)) {
    throw new Error('Collection must have a requests array');
  }

  for (const request of collection.requests) {
    if (!request.name) {
      throw new Error('Each request must have a name');
    }
    if (!request.method) {
      throw new Error(`Request "${request.name}" must have a method`);
    }
    if (!request.url) {
      throw new Error(`Request "${request.name}" must have a URL`);
    }
  }
}

