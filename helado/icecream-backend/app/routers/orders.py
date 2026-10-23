from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import mercadopago_service as mp
from ..config import settings
from ..deps import current_user, get_db
from ..models import Flavor, Order, User
from ..schemas import OrderIn, OrderOut, PayOut, SyncIn

router = APIRouter(prefix="/orders", tags=["orders"])


def _own_order(db: Session, order_id: int, user: User) -> Order:
    order = db.get(Order, order_id)
    if not order or order.user_id != user.id:
        raise HTTPException(404, "Pedido no encontrado")
    return order


@router.post("", response_model=OrderOut, status_code=201)
def create_order(data: OrderIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    flavors = db.scalars(
        select(Flavor).where(Flavor.id.in_(data.flavor_ids), Flavor.active.is_(True))
    ).all()
    if len(flavors) != len(data.flavor_ids):
        raise HTTPException(400, "Algún gusto no existe o no está disponible")
    order = Order(user_id=user.id, total=settings.ice_cream_price, flavors=list(flavors))
    db.add(order)
    db.commit()
    return order


@router.get("/me", response_model=list[OrderOut])
def my_orders(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    ).all()


@router.post("/{order_id}/pay", response_model=PayOut)
def pay(order_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Crea el pago en Mercado Pago y devuelve la URL del checkout (botón "Pagar")."""
    order = _own_order(db, order_id, user)
    if order.status not in ("pending", "failed"):
        raise HTTPException(409, "Este pedido ya está pagado")
    preference_id, init_point = mp.create_preference(order)
    order.mp_preference_id = preference_id
    db.commit()
    return {"init_point": init_point}


@router.post("/{order_id}/sync", response_model=OrderOut)
def sync(order_id: int, data: SyncIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Al volver de Mercado Pago, confirma el pago consultándolo a su API.
    Sirve en local, donde el webhook no puede llegar."""
    order = _own_order(db, order_id, user)
    mp.apply_payment(order, mp.get_payment(data.payment_id))
    db.commit()
    return order
