from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from .. import mercadopago_service as mp
from ..deps import get_db
from ..models import Order

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)):
    """Mercado Pago avisa el id del pago; lo consultamos a su API (no confiamos en el body).
    Necesita una URL pública (https): en local se usa /orders/{id}/sync."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    payment_id = (body.get("data") or {}).get("id") or request.query_params.get("data.id")
    if (body.get("type") or request.query_params.get("type")) != "payment" or not payment_id:
        return {"ok": True}

    payment = mp.get_payment(str(payment_id))
    ref = str(payment.get("external_reference") or "")
    order = db.get(Order, int(ref)) if ref.isdigit() else None
    if order:
        mp.apply_payment(order, payment)
        db.commit()
    return {"ok": True}
