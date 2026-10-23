import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api, { apiError } from "../api";
import { useAuth } from "../auth";
import Cone from "../components/Cone";
import { flavorColor } from "../lib/flavorColors";
import { money } from "../lib/format";

const STORAGE_KEY = "icecream_selection";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // La selección sobrevive si tenés que ingresar o crear cuenta antes de pedir
  const [selected, setSelected] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const flavorsQ = useQuery({
    queryKey: ["flavors"],
    queryFn: () => api.get("/flavors").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const configQ = useQuery({
    queryKey: ["config"],
    queryFn: () => api.get("/config").then((r) => r.data),
    staleTime: Infinity,
  });

  const max = configQ.data?.max_flavors ?? 4;
  const price = configQ.data?.price;
  const flavors = flavorsQ.data ?? [];
  const chosen = selected.map((id) => flavors.find((f) => f.id === id)).filter(Boolean);
  const full = chosen.length >= max;

  const toggle = (id) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < max ? [...cur, id] : cur));

  const order = useMutation({
    mutationFn: () => api.post("/orders", { flavor_ids: chosen.map((f) => f.id) }).then((r) => r.data),
    onSuccess: () => {
      sessionStorage.removeItem(STORAGE_KEY);
      setSelected([]);
      navigate("/pedidos", { state: { notice: "Pedido creado. Ahora pagalo con Mercado Pago." } });
    },
  });

  const submit = () => {
    if (!user) return navigate("/login", { state: { from: "/" } });
    order.mutate();
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_340px]">
      <aside className="order-first self-start rounded-3xl border-2 border-tinta bg-menta p-5 shadow-[0_6px_0_var(--color-tinta)] lg:sticky lg:top-6 lg:order-last">
        <Cone
          max={max}
          className="mx-auto h-44 lg:h-80"
          scoops={chosen.map((f) => ({ id: f.id, name: f.name, color: flavorColor(f.name) }))}
        />
        <p className="mt-2 text-center font-display text-xl">
          {chosen.length} de {max} gustos
        </p>

        {chosen.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {chosen.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-1.5">
                <span className="flex items-center gap-2 font-medium">
                  <span className="h-4 w-4 rounded-full border-2 border-tinta" style={{ background: flavorColor(f.name) }} />
                  {f.name}
                </span>
                <button onClick={() => toggle(f.id)} className="text-sm font-bold text-bambu-oscuro underline" aria-label={`Quitar ${f.name}`}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        {price != null && (
          <p className="mt-4 flex items-baseline justify-between">
            <span>Total</span>
            <strong className="font-display text-2xl">{money(price)}</strong>
          </p>
        )}

        <button className="btn mt-4 w-full" onClick={submit} disabled={chosen.length === 0 || order.isPending}>
          {order.isPending ? "Creando pedido…" : user ? "Hacer pedido" : "Ingresar para pedir"}
        </button>
        {order.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-700">{apiError(order.error)}</p>
        )}
      </aside>

      <section>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Elegí hasta {max} gustos</h1>
        <p className="mt-3 max-w-prose text-lg text-tinta/80">
          Un helado, tus gustos favoritos. Pagás con Mercado Pago y seguís el pedido desde tu cuenta.
        </p>
        {full && <p className="mt-3 font-medium text-bambu-oscuro">Tu helado está completo. Quitá un gusto si querés cambiarlo.</p>}

        {flavorsQ.isPending && <p className="mt-8">Cargando gustos…</p>}
        {flavorsQ.isError && (
          <div role="alert" className="mt-8">
            <p className="font-medium">No pudimos cargar los gustos. {apiError(flavorsQ.error)}</p>
            <button className="btn btn-plain mt-3" onClick={() => flavorsQ.refetch()}>Reintentar</button>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {flavors.map((f) => {
            const on = selected.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggle(f.id)}
                aria-pressed={on}
                disabled={!on && full}
                className={`flex items-center gap-3 rounded-2xl border-2 border-tinta p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? "-translate-y-0.5 bg-white shadow-[0_4px_0_var(--color-tinta)]" : "bg-white/60 hover:bg-white"
                }`}
              >
                <span className="h-11 w-11 shrink-0 rounded-full border-2 border-tinta" style={{ background: flavorColor(f.name) }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{f.name}</span>
                  <span className="block text-sm text-tinta/75">{f.description}</span>
                </span>
                {on && <span className="rounded-full bg-bambu px-2.5 py-0.5 text-xs font-bold text-white">Elegido</span>}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
