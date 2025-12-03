import { Environment } from "../types/models";

const VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function parseEnvironment(env: Environment | null): Record<string, string> {
  if (!env) {
    return {};
  }

  try {
    const parsed = JSON.parse(env.variables || "{}");
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    // ignore parse errors and return empty map
  }
  return {};
}

export function resolveVariables(
  input: string,
  variables: Record<string, string>
): string {
  if (!input) return input;

  return input.replace(VARIABLE_REGEX, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return variables[key] ?? "";
    }
    return `{{${key}}}`;
  });
}


