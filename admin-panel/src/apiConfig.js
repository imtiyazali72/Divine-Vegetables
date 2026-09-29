// Centralized API Configuration & Resilient Network Fetch Utility
export const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

export const API_BASE = getApiBaseUrl();

// Multi-endpoint fetch fallback (Vite Proxy -> IPv4 127.0.0.1 -> localhost)
export const smartFetch = async (endpointPath, options = {}) => {
  let cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  
  // Normalize path if /api prefix is already included in endpointPath
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  } else if (cleanPath === '/api') {
    cleanPath = '';
  }
  
  const candidateUrls = [
    API_BASE ? `${API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`}${cleanPath}` : `/api${cleanPath}`,
    `/api${cleanPath}`,
    `http://127.0.0.1:8000/api${cleanPath}`,
    `http://localhost:8000/api${cleanPath}`
  ];
  
  const uniqueUrls = Array.from(new Set(candidateUrls));
  
  let lastErr = null;
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  
  throw lastErr || new Error("Backend server on port 8000 is unreachable. Please ensure FastAPI backend is running!");
};
