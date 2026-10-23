"""Todo lo que habla con Mercado Pago vive acá."""
import mercadopago
from fastapi import HTTPException

from .config import settings
from .models import Order

STATUS_MAP = {"approved": "paid", "rejected": "failed", "cancelled": "failed"}


def _sdk():
    if not settings.mp_access_token:
        raise HTTPException(503, "Mercado Pago no está configurado en el servidor (falta MP_ACCESS_TOKEN)")
    return mercadopago.SDK(settings.mp_access_token)


def create_preference(order: Order) -> tuple[str, str]:
    """Crea la preferencia de pago y devuelve (preference_id, init_point)."""
    front = settings.frontend_url.rstrip("/")
    data = {
        "items": [{
            "id": str(order.id),
            "title": "Helado IceCream: " + ", ".join(f.name for f in order.flavors),
            "quantity": 1,
            "unit_price": float(order.total),
            "currency_id": settings.mp_currency,
        }],
        "external_reference": str(order.id),
        "back_urls": {"success": f"{front}/pedidos", "failure": f"{front}/pedidos", "pending": f"{front}/pedidos"},
    }
    # Mercado Pago solo acepta estas dos opciones con URLs públicas (https)
    if front.startswith("https://"):
        data["auto_return"] = "approved"
    if settings.backend_url.startswith("https://"):
        data["notification_url"] = f"{settings.backend_url.rstrip('/')}/payments/webhook"

    res = _sdk().preference().create(data)
    body = res.get("response", {})
    if res.get("status") not in (200, 201) or "init_point" not in body:
        raise HTTPException(502, f"Mercado Pago rechazó el pago: {body.get('message', 'error desconocido')}")
    return body["id"], body["init_point"]


def get_payment(payment_id: str) -> dict:
    res = _sdk().payment().get(payment_id)
    if res.get("status") != 200:
        raise HTTPException(404, "No se encontró ese pago en Mercado Pago")
    return res["response"]


def apply_payment(order: Order, payment: dict) -> Order:
    """Actualiza el pedido según el pago. Nunca pisa un pedido ya entregado."""
    if str(payment.get("external_reference")) != str(order.id):
        raise HTTPException(400, "El pago no corresponde a este pedido")
    new_status = STATUS_MAP.get(payment.get("status"))
    if new_status == "paid" and float(payment.get("transaction_amount") or 0) < order.total:
        return order  # monto incorrecto: no se acepta
    if new_status and order.status in ("pending", "failed"):
        order.status = new_status
    return order
