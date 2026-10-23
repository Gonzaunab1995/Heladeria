import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api, { apiError } from "../api";
import { useAuth } from "../auth";

export default function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", repeat: "" });
  const [mismatch, setMismatch] = useState(false);

  const change = useMutation({
    mutationFn: () => api.post("/auth/change-password", { current_password: form.current, new_password: form.next }),
    onSuccess: () => setForm({ current: "", next: "", repeat: "" }),
  });

  function onSubmit(e) {
    e.preventDefault();
    change.reset();
    if (form.next !== form.repeat) return setMismatch(true);
    setMismatch(false);
    change.mutate();
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-display text-4xl">Mi cuenta</h1>
      <p className="mt-3">
        <strong>{user.name}</strong>
        <br />
        {user.email}
      </p>

      <h2 className="mt-10 font-display text-2xl">Cambiar contraseña</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className="block font-medium">
          Contraseña actual
          <input className="field mt-1" type="password" autoComplete="current-password" required value={form.current} onChange={set("current")} />
        </label>
        <label className="block font-medium">
          Nueva contraseña
          <input className="field mt-1" type="password" autoComplete="new-password" required minLength={8} value={form.next} onChange={set("next")} />
          <span className="mt-1 block text-sm font-normal text-tinta/75">Mínimo 8 caracteres.</span>
        </label>
        <label className="block font-medium">
          Repetir nueva contraseña
          <input className="field mt-1" type="password" autoComplete="new-password" required value={form.repeat} onChange={set("repeat")} />
        </label>

        {mismatch && <p role="alert" className="font-medium text-red-700">Las contraseñas nuevas no coinciden.</p>}
        {change.isError && <p role="alert" className="font-medium text-red-700">{apiError(change.error)}</p>}
        {change.isSuccess && <p role="status" className="font-medium text-bambu-oscuro">Contraseña actualizada.</p>}

        <button className="btn w-full" disabled={change.isPending}>
          {change.isPending ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
