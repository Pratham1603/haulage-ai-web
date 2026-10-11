import { createContext, useContext, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { apiRequest, LIVE_API_ENABLED } from "./lib/api";

const AuthContext = createContext(null);
const KEY = "haulage-demo-session";

export const ROLES = ["Ops Manager", "Dispatcher", "Warehouse Lead", "Finance", "Owner"];

const ROLE_LABELS = {
  owner: "Owner",
  ops_manager: "Ops Manager",
  dispatcher: "Dispatcher",
  warehouse_lead: "Warehouse Lead",
  finance: "Finance",
};

const readSession = () => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readSession);

  const login = async (email, password) => {
    if (LIVE_API_ENABLED) {
      try {
        const result = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        const s = {
          email: result.user.email,
          role: ROLE_LABELS[result.user.role] || result.user.role,
          token: result.access_token,
          user: result.user,
        };
        try {
          sessionStorage.setItem(KEY, JSON.stringify(s));
        } catch (e) {}
        setSession(s);
        return s;
      } catch (error) {
        if (error.status) throw error;
      }
    }

    const s = { email, role: "Ops Manager" };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
    setSession(s);
    return s;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(KEY);
    } catch (e) {}
    setSession(null);
  };

  const setRole = (role) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, role };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const RequireAuth = ({ children }) => {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
};
