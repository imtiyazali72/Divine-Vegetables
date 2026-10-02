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

// Multi-endpoint fetch fallback (Production URL -> Vite Proxy -> IPv4 127.0.0.1 -> localhost)
export const smartFetch = async (endpointPath, options = {}) => {
  let cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  // Normalize path if /api prefix is already included in endpointPath
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath === '/api') {
    cleanPath = '';
  }
  
  const candidateUrls = [
    `${API_BASE}${cleanPath}`,
    `/api${cleanPath}`,
    `http://127.0.0.1:8000/api${cleanPath}`,
    `http://localhost:8000/api${cleanPath}`
  ];
  
  const uniqueUrls = Array.from(new Set(candidateUrls));
  
  let lastErr = null;
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) {
        return res;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  
  throw lastErr || new Error("Backend server is unreachable.");
};
