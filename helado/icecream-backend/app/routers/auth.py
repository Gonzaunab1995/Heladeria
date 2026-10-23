import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import current_user, get_db, is_admin
from ..models import User
from ..schemas import ChangePasswordIn, LoginIn, RefreshIn, RegisterIn, TokenOut, UserOut
from ..security import create_tokens, decode, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado")
    user = User(email=email, name=data.name, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    return create_tokens(user.id)


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos")
    return create_tokens(user.id)


@router.post("/refresh", response_model=TokenOut)
def refresh(data: RefreshIn, db: Session = Depends(get_db)):
    try:
        user_id = decode(data.refresh_token, "refresh")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token inválido")
    if not db.get(User, user_id):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario inexistente")
    return create_tokens(user_id)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return UserOut.model_validate(user).model_copy(update={"is_admin": is_admin(user)})


@router.post("/change-password", status_code=204)
def change_password(
    data: ChangePasswordIn, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual es incorrecta")
    user.password_hash = hash_password(data.new_password)
    db.commit()
