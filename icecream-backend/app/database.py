from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

url = settings.database_url
kwargs: dict = {"pool_pre_ping": True}

if url.startswith("sqlite"):
    kwargs["connect_args"] = {"check_same_thread": False}
elif url.startswith("oracle") and settings.oracle_wallet_dir:
    # Oracle Autonomous (mTLS) en modo thin: no requiere Instant Client
    kwargs["connect_args"] = {
        "config_dir": settings.oracle_wallet_dir,
        "wallet_location": settings.oracle_wallet_dir,
        "wallet_password": settings.oracle_wallet_password,
    }
    kwargs.update(pool_size=5, max_overflow=5, pool_recycle=1800)

engine = create_engine(url, **kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass
