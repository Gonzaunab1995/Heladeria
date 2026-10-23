import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiError } from "../api";
import { useAuth } from "../auth";
import Logo from "../components/Logo";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <Logo className="mx-auto h-20 w-20" />
      <h1 className="mt-4 text-center font-display text-4xl">Ingresar</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block font-medium">
          Email
          <input className="field mt-1" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block font-medium">
          Contraseña
          <input className="field mt-1" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p role="alert" className="font-medium text-red-700">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
      </form>
      <p className="mt-6 text-center">
        ¿No tenés cuenta? <Link to="/registro" state={{ from }} className="font-bold text-bambu-oscuro underline">Crear cuenta</Link>
      </p>
    </main>
  );
}
