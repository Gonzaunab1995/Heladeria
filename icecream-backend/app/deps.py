import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import SessionLocal
from .models import User
from .security import decode

bearer = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not creds:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No autenticado")
    try:
        user_id = decode(creds.credentials, "access")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o vencido")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario inexistente")
    return user


def is_admin(user: User) -> bool:
    """Admin = su email está en ADMIN_EMAILS (no hace falta tocar la base de datos)."""
    return user.email.lower() in settings.admin_email_list


def admin_user(user: User = Depends(current_user)) -> User:
    if not is_admin(user):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Solo para administradores")
    return user
