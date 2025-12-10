import { URL } from "url";
import { RequestParam, RequestAuth } from "../types/models";

/**
 * Build final URL with query parameters
 */
export function buildFinalUrl(baseUrl: string, params: RequestParam[]): string {
  try {
    const url = new URL(baseUrl);

    // Get only active params
    const activeParams = params.filter((p) => p.active);

    // Add/update query parameters
    for (const param of activeParams) {
      if (param.key.trim()) {
        // URL encode the value
        const encodedValue = encodeURIComponent(param.value);
        url.searchParams.set(param.key, encodedValue);
      }
    }

    return url.toString();
  } catch (error) {
    // If URL parsing fails, try to append params manually
    if (error instanceof TypeError) {
      // Invalid URL, try to handle it
      const activeParams = params.filter((p) => p.active && p.key.trim());
      if (activeParams.length === 0) {
        return baseUrl;
      }

      const queryString = activeParams
        .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join("&");

      const separator = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${separator}${queryString}`;
    }
    return baseUrl;
  }
}

/**
 * Apply authorization to headers and URL
 */
export function applyAuth(
  auth: RequestAuth | null,
  headers: Record<string, string>,
  url: string
): { headers: Record<string, string>; url: string } {
  if (!auth || auth.type === "none") {
    return { headers, url };
  }

  const resultHeaders = { ...headers };
  let resultUrl = url;

  switch (auth.type) {
    case "apikey": {
      if (!auth.key || !auth.value) {
        break;
      }

      if (auth.in_location === "query") {
        // Add to URL
        try {
          const urlObj = new URL(resultUrl);
          urlObj.searchParams.set(auth.key, auth.value);
          resultUrl = urlObj.toString();
        } catch {
          const separator = resultUrl.includes("?") ? "&" : "?";
          resultUrl = `${resultUrl}${separator}${encodeURIComponent(auth.key)}=${encodeURIComponent(auth.value)}`;
        }
      } else {
        // Add to headers (default)
        resultHeaders[auth.key] = auth.value;
      }
      break;
    }

    case "bearer": {
      if (auth.value) {
        resultHeaders["Authorization"] = `Bearer ${auth.value}`;
      }
      break;
    }

    case "basic": {
      if (auth.username && auth.password) {
        // Encode username:password as base64
        const credentials = `${auth.username}:${auth.password}`;
        const encoded = Buffer.from(credentials).toString("base64");
        resultHeaders["Authorization"] = `Basic ${encoded}`;
      }
      break;
    }

    case "header": {
      if (auth.headerName && auth.headerValue) {
        resultHeaders[auth.headerName] = auth.headerValue;
      }
      break;
    }
  }

  return { headers: resultHeaders, url: resultUrl };
}

/**
 * Merge custom headers with auth headers
 * Auth headers take precedence for Authorization header
 */
export function mergeHeaders(
  customHeaders: Record<string, string>,
  authHeaders: Record<string, string>
): Record<string, string> {
  const merged = { ...customHeaders };

  // Auth headers override custom headers, especially for Authorization
  for (const [key, value] of Object.entries(authHeaders)) {
    if (key.toLowerCase() === "authorization") {
      // Always use auth's Authorization header
      merged[key] = value;
    } else {
      // Only override if custom header doesn't exist
      if (!merged[key]) {
        merged[key] = value;
      }
    }
  }

  return merged;
}

