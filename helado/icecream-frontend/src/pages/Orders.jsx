import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import api, { apiError } from "../api";
import { flavorColor } from "../lib/flavorColors";
import { date, money, STATUS } from "../lib/format";

const RESULT = {
  paid: { text: "¡Pago aprobado! Tu pedido está pagado.", cls: "bg-menta" },
  failed: { text: "El pago fue rechazado. Podés intentarlo de nuevo.", cls: "bg-red-100" },
  pending: { text: "Tu pago está pendiente de acreditación. Se actualiza solo cuando Mercado Pago lo confirme.", cls: "bg-vainilla" },
};

export default function Orders() {
  const qc = useQueryClient();
  const notice = useLocation().state?.notice;
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const handled = useRef(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders/me").then((r) => r.data),
    // Mientras haya un pago pendiente, consulta cada 5 s
    refetchInterval: (q) => (q.state.data?.some((o) => o.status === "pending") ? 5000 : false),
  });

  // Botón "Pagar": pide la URL de Mercado Pago y redirige
  const pay = useMutation({
    mutationFn: (id) => api.post(`/orders/${id}/pay`).then((r) => r.data),
    onSuccess: (d) => {
      window.location.href = d.init_point;
    },
  });

  // Al volver de Mercado Pago, confirma el pago con la API
  const sync = useMutation({
    mutationFn: ({ orderId, paymentId }) =>
      api.post(`/orders/${orderId}/sync`, { payment_id: paymentId }).then((r) => r.data),
    onSuccess: (o) => {
      setResult(o.status === "paid" ? "paid" : o.status === "failed" ? "failed" : "pending");
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const paymentId = params.get("payment_id") || params.get("collection_id");
    const orderId = params.get("external_reference");
    if (paymentId && paymentId !== "null" && orderId) sync.mutate({ orderId, paymentId });
    if (params.toString()) setParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl">Mis pedidos</h1>

      {result && <p role="status" className={`mt-4 rounded-xl px-4 py-3 font-medium ${RESULT[result].cls}`}>{RESULT[result].text}</p>}
      {sync.isError && <p role="alert" className="mt-4 font-medium text-red-700">No pudimos confirmar el pago. {apiError(sync.error)}</p>}
      {notice && !result && <p className="mt-4 rounded-xl bg-vainilla px-4 py-3 font-medium">{notice}</p>}

      {isPending && <p className="mt-6">Cargando pedidos…</p>}
      {isError && (
        <div role="alert" className="mt-6">
          <p className="font-medium">No pudimos cargar tus pedidos. {apiError(error)}</p>
          <button className="btn btn-plain mt-3" onClick={() => refetch()}>Reintentar</button>
        </div>
      )}

      {data?.length === 0 && (
        <div className="mt-8">
          <p className="text-lg">Todavía no pediste ningún helado.</p>
          <Link to="/" className="btn mt-4">Armar mi helado</Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {data?.map((o) => {
          const st = STATUS[o.status] ?? { label: o.status, cls: "bg-white" };
          const canPay = o.status === "pending" || o.status === "failed";
          const paying = pay.isPending && pay.variables === o.id;
          return (
            <li key={o.id} className="rounded-2xl border-2 border-tinta bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">Pedido {o.id}</p>
                <span className={`rounded-full border-2 border-tinta px-3 py-0.5 text-sm font-bold ${st.cls}`}>{st.label}</span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {o.flavors.map((f) => (
                  <li key={f.id} className="flex items-center gap-1.5 rounded-full bg-leche px-3 py-1 text-sm font-medium">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-tinta" style={{ background: flavorColor(f.name) }} />
                    {f.name}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-tinta/75">
                  {date(o.created_at)}
                  <strong className="ml-3 text-base text-tinta">{money(o.total)}</strong>
                </p>
                {canPay && (
                  <button className="btn btn-mp" onClick={() => pay.mutate(o.id)} disabled={pay.isPending}>
                    {paying ? "Abriendo Mercado Pago…" : o.status === "failed" ? "Reintentar pago" : "Pagar con Mercado Pago"}
                  </button>
                )}
              </div>
              {pay.isError && pay.variables === o.id && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-700">{apiError(pay.error)}</p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
