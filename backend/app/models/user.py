from enum import Enum
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.common import MongoBaseModel, PyObjectId, utc_now


class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.CUSTOMER
    team_id: PyObjectId | None = None  # required if role == staff


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(MongoBaseModel):
    name: str
    email: EmailStr
    role: UserRole
    team_id: PyObjectId | None = None
    created_at: datetime


class UserInDB(UserOut):
    hashed_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut