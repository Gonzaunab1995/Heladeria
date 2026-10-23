from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from .config import settings

_ph = PasswordHasher()


def hash_password(p: str) -> str:
    return _ph.hash(p)


def verify_password(p: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, p)
    except VerifyMismatchError:
        return False


def _token(sub: int, kind: str, delta: timedelta) -> str:
    exp = datetime.now(timezone.utc) + delta
    return jwt.encode({"sub": str(sub), "type": kind, "exp": exp}, settings.jwt_secret, "HS256")


def create_tokens(user_id: int) -> dict:
    return {
        "access_token": _token(user_id, "access", timedelta(minutes=settings.access_minutes)),
        "refresh_token": _token(user_id, "refresh", timedelta(days=settings.refresh_days)),
    }


def decode(token: str, kind: str) -> int:
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    if payload.get("type") != kind:
        raise jwt.InvalidTokenError("tipo de token inválido")
    return int(payload["sub"])
