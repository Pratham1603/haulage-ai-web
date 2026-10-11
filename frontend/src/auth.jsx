import { createContext, useContext, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);
const KEY = "haulage-demo-session";

export const ROLES = ["Ops Manager", "Dispatcher", "Warehouse Lead", "Finance", "Owner"];

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

  const login = (email) => {
    const s = { email, role: "Ops Manager" };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {}
    setSession(s);
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
