import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api, { clearTokens, getTokens, saveTokens } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getTokens().access));

  // Si hay sesión guardada, recupera el usuario al abrir la app
  useEffect(() => {
    if (!getTokens().access) return;
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  // El interceptor avisa cuando no se pudo renovar la sesión
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [queryClient]);

  async function authenticate(path, body) {
    const { data } = await api.post(path, body);
    saveTokens(data);
    const me = await api.get("/auth/me");
    setUser(me.data);
  }

  const value = {
    user,
    loading,
    login: (email, password) => authenticate("/auth/login", { email, password }),
    register: (name, email, password) => authenticate("/auth/register", { name, email, password }),
    logout: () => {
      clearTokens();
      setUser(null);
      queryClient.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
