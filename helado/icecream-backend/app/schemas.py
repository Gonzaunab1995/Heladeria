from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .config import settings

OrderStatus = Literal["pending", "paid", "delivered", "failed"]


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    is_admin: bool = False


class FlavorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    image_url: str


class AdminFlavorOut(FlavorOut):
    active: bool


class FlavorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field("", max_length=255)
    image_url: str = Field("", max_length=500)


class FlavorUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = Field(None, max_length=255)
    active: bool | None = None


class OrderIn(BaseModel):
    flavor_ids: list[int] = Field(min_length=1, max_length=settings.max_flavors)

    @field_validator("flavor_ids")
    @classmethod
    def unique(cls, v: list[int]) -> list[int]:
        if len(set(v)) != len(v):
            raise ValueError("No repitas gustos")
        return v


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    total: float
    created_at: datetime
    flavors: list[FlavorOut]


class AdminOrderOut(OrderOut):
    user_name: str
    user_email: str


class StatusIn(BaseModel):
    status: OrderStatus


class PayOut(BaseModel):
    init_point: str


class SyncIn(BaseModel):
    payment_id: str = Field(min_length=1, max_length=50)
