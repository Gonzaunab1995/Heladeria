from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import select

from .config import settings
from .database import Base, SessionLocal, engine
from .models import Flavor
from .routers import admin, auth, flavors, orders, payments

SEED = [
    ("Chocolate", "Intenso, con cacao real"),
    ("Dulce de leche", "Clásico argentino"),
    ("Frutilla", "A la crema, con trocitos"),
    ("Vainilla", "Suave y cremosa"),
    ("Menta granizada", "Fresca, con chips de chocolate"),
    ("Limón", "Cítrico, al agua"),
    ("Banana split", "Banana, dulce de leche y chocolate"),
    ("Sambayón", "Con vino marsala"),
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)  # en producción madura: Alembic
    with SessionLocal() as db:
        if not db.scalar(select(Flavor).limit(1)):
            db.add_all(Flavor(name=n, description=d) for n, d in SEED)
            db.commit()
    yield


app = FastAPI(title="IceCream API", version="1.0.0", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(flavors.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse("/docs")


@app.get("/config")
def public_config():
    return {"price": settings.ice_cream_price, "max_flavors": settings.max_flavors}


@app.get("/health")
def health():
    return {"status": "ok"}
