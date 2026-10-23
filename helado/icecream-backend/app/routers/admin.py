from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import admin_user, get_db
from ..models import Flavor, Order, User
from ..schemas import (
    AdminFlavorOut, AdminOrderOut, FlavorCreate, FlavorOut, FlavorUpdate, OrderOut, StatusIn,
)
from .flavors import invalidate_cache

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_user)])


# ---------- Pedidos ----------
@router.get("/orders", response_model=list[AdminOrderOut])
def list_orders(status: str | None = None, db: Session = Depends(get_db)):
    q = select(Order, User).join(User, User.id == Order.user_id).order_by(Order.created_at.desc())
    if status:
        q = q.where(Order.status == status)
    return [
        AdminOrderOut(
            id=o.id, status=o.status, total=o.total, created_at=o.created_at,
            flavors=[FlavorOut.model_validate(f) for f in o.flavors],
            user_name=u.name, user_email=u.email,
        )
        for o, u in db.execute(q).all()
    ]


@router.patch("/orders/{order_id}", response_model=OrderOut)
def set_order_status(order_id: int, data: StatusIn, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Pedido no encontrado")
    order.status = data.status
    db.commit()
    return order


# ---------- Gustos ----------
@router.get("/flavors", response_model=list[AdminFlavorOut])
def list_flavors(db: Session = Depends(get_db)):
    return db.scalars(select(Flavor).order_by(Flavor.name)).all()


@router.post("/flavors", response_model=AdminFlavorOut, status_code=201)
def create_flavor(data: FlavorCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Flavor).where(Flavor.name == data.name.strip())):
        raise HTTPException(409, "Ya existe un gusto con ese nombre")
    flavor = Flavor(name=data.name.strip(), description=data.description, image_url=data.image_url)
    db.add(flavor)
    db.commit()
    invalidate_cache()
    return flavor


@router.patch("/flavors/{flavor_id}", response_model=AdminFlavorOut)
def update_flavor(flavor_id: int, data: FlavorUpdate, db: Session = Depends(get_db)):
    flavor = db.get(Flavor, flavor_id)
    if not flavor:
        raise HTTPException(404, "Gusto no encontrado")
    changes = data.model_dump(exclude_unset=True)
    if "name" in changes:
        changes["name"] = changes["name"].strip()
        other = db.scalar(select(Flavor).where(Flavor.name == changes["name"], Flavor.id != flavor_id))
        if other:
            raise HTTPException(409, "Ya existe un gusto con ese nombre")
    for key, value in changes.items():
        setattr(flavor, key, value)
    db.commit()
    invalidate_cache()
    return flavor
