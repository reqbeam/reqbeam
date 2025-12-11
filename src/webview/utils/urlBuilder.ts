import { RequestParam } from "../../types/models";

/**
 * Build final URL with query parameters (browser-compatible version)
 * This is used in the webview for URL preview
 */
export function buildFinalUrl(baseUrl: string, params: RequestParam[]): string {
  if (!baseUrl) return "";

  try {
    // Use browser's URL API
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


