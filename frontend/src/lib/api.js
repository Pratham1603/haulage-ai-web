const API_BASE = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8001").replace(/\/$/, "");

export const LIVE_API_ENABLED = process.env.REACT_APP_USE_LIVE_API === "true";
const SESSION_KEY = "haulage-demo-session";

const readToken = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null")?.token;
  } catch (e) {
    return null;
  }
};

export const clearApiSession = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {}
};

export const apiRequest = async (path, options = {}) => {
  const token = readToken();
  const response = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 401) clearApiSession();
    const error = new Error(detail || `API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : response;
};
