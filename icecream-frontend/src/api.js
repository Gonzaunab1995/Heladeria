import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const AT = "icecream_access";
const RT = "icecream_refresh";

export const getTokens = () => ({
  access: localStorage.getItem(AT),
  refresh: localStorage.getItem(RT),
});
export const saveTokens = (t) => {
  localStorage.setItem(AT, t.access_token);
  localStorage.setItem(RT, t.refresh_token);
};
export const clearTokens = () => {
  localStorage.removeItem(AT);
  localStorage.removeItem(RT);
};

const api = axios.create({ baseURL });

// Agrega el token a cada petición
api.interceptors.request.use((config) => {
  const { access } = getTokens();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

// Si el access token venció, lo renueva (una sola vez aunque fallen varias peticiones) y reintenta
let refreshing = null;
const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = AUTH_PATHS.some((p) => original?.url?.includes(p));
    const { refresh } = getTokens();

    if (error.response?.status === 401 && !original._retry && !isAuthCall && refresh) {
      original._retry = true;
      try {
        refreshing ??= axios
          .post(`${baseURL}/auth/refresh`, { refresh_token: refresh })
          .then((r) => {
            saveTokens(r.data);
            return r.data.access_token;
          })
          .finally(() => {
            refreshing = null;
          });
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearTokens();
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);

const FIELD = {
  email: "El email",
  password: "La contraseña",
  new_password: "La nueva contraseña",
  name: "El nombre",
  flavor_ids: "Los gustos",
  description: "La descripción",
};

function validationMessage(x) {
  const loc = x.loc?.at(-1);
  const field = FIELD[loc] ?? "El dato";
  if (loc === "email") return "El email no es válido";
  if (x.type === "string_too_short") return `${field} debe tener al menos ${x.ctx?.min_length} caracteres`;
  if (x.type === "string_too_long") return `${field} es demasiado largo`;
  if (x.type === "too_short") return "Elegí al menos un gusto";
  if (x.type === "too_long") return `Elegí hasta ${x.ctx?.max_length} gustos`;
  if (x.type === "value_error") return x.msg.replace(/^Value error, /, "");
  return `${field} no es válido`;
}

/** Convierte un error de axios en un mensaje legible en español. */
export function apiError(err) {
  if (!err?.response) return "No se pudo conectar con el servidor. Revisá que la API esté corriendo.";
  const d = err.response.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map(validationMessage).join(". ");
  return "Algo salió mal. Probá de nuevo.";
}

export default api;
