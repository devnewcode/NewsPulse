export function getApiBase() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  // In browser: detect if running locally or deployed on Vercel/cloud
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      // Deployed web app: if envUrl is set and is a remote URL, use it
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl.replace(/\/$/, '');
      }
      // Fallback for deployed frontend: use the live Render backend
      return 'https://newspulse-wj9w.onrender.com';
    }
  }

  // Local environment or SSR
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, '');
  }

  return 'http://localhost:5000';
}

/**
 * Reusable fetch wrapper that automatically handles fallback
 * between localhost and 127.0.0.1 on Windows environments.
 */
export async function fetchApi(endpoint, options = {}) {
  const base = getApiBase();

  try {
    const res = await fetch(`${base}${endpoint}`, options);
    return res;
  } catch (err) {
    // If localhost failed (common Windows IPv6 ::1 issue), try 127.0.0.1
    if (base.includes('localhost')) {
      try {
        const fallbackBase = base.replace('localhost', '127.0.0.1');
        return await fetch(`${fallbackBase}${endpoint}`, options);
      } catch (fallbackErr) {
        throw new Error('Local backend server is offline on port 5000');
      }
    }
    throw new Error(`Unable to connect to backend at ${base}: ${err.message}`);
  }
}

