import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { apiError } from "../api";
import { flavorColor } from "../lib/flavorColors";
import { date, money, STATUS } from "../lib/format";

export default function Admin() {
  const [tab, setTab] = useState("pedidos");
  const tabClass = (t) =>
    `rounded-full border-2 border-tinta px-4 py-1.5 font-bold ${tab === t ? "bg-frutilla" : "bg-white hover:bg-menta"}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-4xl">Panel de administración</h1>
      <div role="tablist" className="mt-5 flex gap-2">
        <button role="tab" aria-selected={tab === "pedidos"} className={tabClass("pedidos")} onClick={() => setTab("pedidos")}>Pedidos</button>
        <button role="tab" aria-selected={tab === "gustos"} className={tabClass("gustos")} onClick={() => setTab("gustos")}>Gustos</button>
      </div>
      <div className="mt-6">{tab === "pedidos" ? <AdminOrders /> : <AdminFlavors />}</div>
    </main>
  );
}

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: () => api.get("/admin/orders", { params: filter ? { status: filter } : {} }).then((r) => r.data),
    refetchInterval: 10000,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const collected = (data ?? []).filter((o) => o.status === "paid" || o.status === "delivered").reduce((s, o) => s + o.total, 0);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="font-medium">
          Estado
          <select className="field mt-1 !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        {data && (
          <p className="text-right">
            {data.length} {data.length === 1 ? "pedido" : "pedidos"}<br />
            Cobrado: <strong className="font-display text-xl">{money(collected)}</strong>
          </p>
        )}
      </div>

      {isPending && <p className="mt-6">Cargando pedidos…</p>}
      {isError && <p role="alert" className="mt-6 font-medium text-red-700">{apiError(error)}</p>}
      {setStatus.isError && <p role="alert" className="mt-4 font-medium text-red-700">{apiError(setStatus.error)}</p>}
      {data?.length === 0 && <p className="mt-6 text-lg">No hay pedidos con ese estado.</p>}

      <ul className="mt-6 space-y-3">
        {data?.map((o) => (
          <li key={o.id} className="rounded-2xl border-2 border-tinta bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">Pedido {o.id}: {o.user_name}</p>
                <p className="text-sm text-tinta/75">{o.user_email}</p>
                <p className="text-sm text-tinta/75">{date(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl">{money(o.total)}</p>
                <select
                  aria-label={`Estado del pedido ${o.id}`}
                  className={`field mt-1 !w-auto font-bold ${STATUS[o.status]?.cls ?? ""}`}
                  value={o.status}
                  onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })}
                >
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {o.flavors.map((f) => (
                <li key={f.id} className="flex items-center gap-1.5 rounded-full bg-leche px-3 py-1 text-sm font-medium">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-tinta" style={{ background: flavorColor(f.name) }} />
                  {f.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdminFlavors() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState(null); // { id, name, description }

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-flavors"],
    queryFn: () => api.get("/admin/flavors").then((r) => r.data),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-flavors"] });
    qc.invalidateQueries({ queryKey: ["flavors"] });
  };
  const create = useMutation({
    mutationFn: () => api.post("/admin/flavors", form),
    onSuccess: () => { setForm({ name: "", description: "" }); refresh(); },
  });
  const update = useMutation({
    mutationFn: ({ id, ...changes }) => api.patch(`/admin/flavors/${id}`, changes),
    onSuccess: () => { setEditing(null); refresh(); },
  });

  const submitNew = (e) => { e.preventDefault(); create.mutate(); };

  return (
    <section>
      <form onSubmit={submitNew} className="grid gap-3 rounded-2xl border-2 border-tinta bg-menta p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <label className="font-medium">
          Nombre
          <input className="field mt-1" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="font-medium">
          Descripción
          <input className="field mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <button className="btn" disabled={create.isPending}>{create.isPending ? "Agregando…" : "Agregar gusto"}</button>
      </form>
      {create.isError && <p role="alert" className="mt-3 font-medium text-red-700">{apiError(create.error)}</p>}
      {update.isError && <p role="alert" className="mt-3 font-medium text-red-700">{apiError(update.error)}</p>}

      {isPending && <p className="mt-6">Cargando gustos…</p>}
      {isError && <p role="alert" className="mt-6 font-medium text-red-700">{apiError(error)}</p>}

      <ul className="mt-6 space-y-2">
        {data?.map((f) => {
          const isEditing = editing?.id === f.id;
          return (
            <li key={f.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-tinta bg-white p-3 ${f.active ? "" : "opacity-60"}`}>
              <span className="h-9 w-9 shrink-0 rounded-full border-2 border-tinta" style={{ background: flavorColor(f.name) }} />
              {isEditing ? (
                <>
                  <input aria-label="Nombre" className="field !w-44" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <input aria-label="Descripción" className="field !w-auto min-w-0 flex-1" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  <button className="btn !py-1.5" disabled={update.isPending} onClick={() => update.mutate(editing)}>Guardar</button>
                  <button className="btn btn-plain" onClick={() => setEditing(null)}>Cancelar</button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{f.name}</span>
                    <span className="block text-sm text-tinta/75">{f.description}</span>
                  </span>
                  <span className={`rounded-full border-2 border-tinta px-3 py-0.5 text-sm font-bold ${f.active ? "bg-menta" : "bg-white"}`}>
                    {f.active ? "Disponible" : "Oculto"}
                  </span>
                  <button className="btn btn-plain" onClick={() => setEditing({ id: f.id, name: f.name, description: f.description })}>Editar</button>
                  <button className="btn btn-plain" disabled={update.isPending} onClick={() => update.mutate({ id: f.id, active: !f.active })}>
                    {f.active ? "Ocultar" : "Mostrar"}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
