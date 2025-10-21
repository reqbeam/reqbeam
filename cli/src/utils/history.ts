import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface HistoryEntry {
  method: string;
  url: string;
  statusCode?: number;
  source: 'CLI' | 'WEB';
  duration?: number;
  error?: string;
}

/**
 * Log request history to the backend API
 * This is done asynchronously and errors are silently caught to not disrupt CLI flow
 */
export async function logHistory(entry: HistoryEntry): Promise<void> {
  try {
    // Get backend URL from environment or use default
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const historyApiUrl = `${backendUrl}/api/history`;

    // Send history entry to backend (async, don't wait)
    await axios.post(historyApiUrl, entry, {
      timeout: 3000, // 3 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Silently fail - we don't want to disrupt CLI flow if backend is down
    // Uncomment below for debugging:
    // console.error('Failed to log history:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Create a history entry from a request and response
 */
export function createHistoryEntry(
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  error?: string
): HistoryEntry {
  return {
    method: method.toUpperCase(),
    url,
    statusCode,
    source: 'CLI',
    duration,
    error,
  };
}

