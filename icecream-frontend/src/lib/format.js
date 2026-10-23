export const STATUS = {
  pending: { label: "Pendiente de pago", cls: "bg-vainilla" },
  paid: { label: "Pagado", cls: "bg-menta" },
  delivered: { label: "Entregado", cls: "bg-sky-100" },
  failed: { label: "Pago rechazado", cls: "bg-red-100" },
};

export const money = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export const date = (s) =>
  new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
