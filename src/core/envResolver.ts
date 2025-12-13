/**
 * Environment Variable Resolver
 * Handles extraction, resolution, and validation of environment variables
 */

export interface VariableMatch {
  fullMatch: string;
  variableName: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extract all environment variable patterns from text
 * Pattern: {{variable_name}}
 */
export function extractVariables(text: string): VariableMatch[] {
  const matches: VariableMatch[] = [];
  // Pattern: {{variable}} where variable can contain letters, numbers, and underscores
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      variableName: match[1].toLowerCase(), // Case-insensitive
      startIndex: match.index,
      endIndex: regex.lastIndex,
    });
  }

  return matches;
}

/**
 * Resolve all variables in text using environment variables
 * Returns the text with variables replaced by their values
 */
export function resolveVariables(
  text: string,
  envVars: Record<string, string>
): string {
  if (!text || !envVars) return text;

  // Pattern: {{variable}} - case-insensitive matching
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    const key = varName.toLowerCase();
    const value = envVars[key];
    return value !== undefined ? value : match; // Keep original if not found
  });
}

/**
 * Get list of missing variables in text
 */
export function getMissingVariables(
  text: string,
  envVars: Record<string, string>
): string[] {
  const variables = extractVariables(text);
  const missing: string[] = [];
  const found = new Set<string>();

  for (const variable of variables) {
    const key = variable.variableName.toLowerCase();
    if (!found.has(key) && !(key in envVars)) {
      missing.push(variable.variableName);
      found.add(key);
    }
  }

  return missing;
}

/**
 * Check if a variable exists in environment
 */
export function hasVariable(
  variableName: string,
  envVars: Record<string, string>
): boolean {
  const key = variableName.toLowerCase();
  return key in envVars;
}

/**
 * Get resolved value for a variable
 */
export function getVariableValue(
  variableName: string,
  envVars: Record<string, string>
): string | null {
  const key = variableName.toLowerCase();
  return envVars[key] ?? null;
}

/**
 * Validate all variables in text and return status for each
 */
export function validateVariables(
  text: string,
  envVars: Record<string, string>
): Array<{ variable: string; exists: boolean; value?: string }> {
  const variables = extractVariables(text);
  const results: Array<{ variable: string; exists: boolean; value?: string }> = [];
  const seen = new Set<string>();

  for (const match of variables) {
    const key = match.variableName.toLowerCase();
    if (!seen.has(key)) {
      const exists = key in envVars;
      results.push({
        variable: match.variableName,
        exists,
        value: exists ? envVars[key] : undefined,
      });
      seen.add(key);
    }
  }

  return results;
}

