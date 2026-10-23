import time

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Flavor
from ..schemas import FlavorOut

router = APIRouter(prefix="/flavors", tags=["flavors"])

_cache: dict = {"at": 0.0, "data": []}
TTL = 60  # segundos: los gustos casi no cambian


def invalidate_cache() -> None:
    _cache["at"] = 0.0


@router.get("", response_model=list[FlavorOut])
def list_flavors(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "public, max-age=60"
    if time.time() - _cache["at"] > TTL:
        rows = db.scalars(select(Flavor).where(Flavor.active.is_(True)).order_by(Flavor.name)).all()
        _cache["data"] = [FlavorOut.model_validate(r) for r in rows]
        _cache["at"] = time.time()
    return _cache["data"]
