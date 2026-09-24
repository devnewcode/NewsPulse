const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Reusable fetch wrapper that automatically handles fallback
 * between localhost and 127.0.0.1 on Windows environments.
 */
export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    return res;
  } catch (err) {
    // If localhost failed (common Windows IPv6 ::1 issue), try 127.0.0.1
    if (API_BASE.includes('localhost')) {
      try {
        const fallbackBase = API_BASE.replace('localhost', '127.0.0.1');
        return await fetch(`${fallbackBase}${endpoint}`, options);
      } catch (fallbackErr) {
        // Both failed — backend is offline
        throw new Error('Backend server is offline on port 5000');
      }
    }
    throw new Error('Backend server is offline on port 5000');
  }
}
