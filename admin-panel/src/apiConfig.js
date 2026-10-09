// Centralized API Configuration & Resilient Network Fetch Utility
export const getApiBaseUrl = () => {
  let base = '/api';
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    base = import.meta.env.VITE_API_URL;
  } else if (typeof window !== 'undefined' && window.location) {
    base = `${window.location.origin}/api`;
  }
  
  // Clean trailing slashes
  base = base.replace(/\/+$/, '');
  
  // Ensure /api suffix exists at the end of base URL
  if (!base.endsWith('/api')) {
    base = `${base}/api`;
  }
  return base;
};

export const API_BASE = getApiBaseUrl();

// Fast-path network fetch utility with zero-delay fallback
export const smartFetch = async (endpointPath, options = {}) => {
  let cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  // Normalize path if /api prefix is already included in endpointPath
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath === '/api') {
    cleanPath = '';
  }
  
  const primaryUrl = `${API_BASE}${cleanPath}`;
  
  // 1. Instant execution on primary configured API endpoint
  try {
    const res = await fetch(primaryUrl, options);
    if (res.ok || res.status < 500) {
      return res;
    }
  } catch (err) {
    // Primary URL error fallback
  }

  // 2. Only attempt local dev ports if running on localhost environment
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
  );

  if (isLocalhost) {
    const devCandidates = [
      `/api${cleanPath}`,
      `http://127.0.0.1:8000/api${cleanPath}`,
      `http://localhost:8000/api${cleanPath}`
    ];
    for (const devUrl of devCandidates) {
      if (devUrl === primaryUrl) continue;
      try {
        const devRes = await fetch(devUrl, options);
        if (devRes.ok || devRes.status < 500) {
          return devRes;
        }
      } catch (e) {}
    }
  }
  
  throw new Error("Backend server is unreachable. Please try again.");
};
