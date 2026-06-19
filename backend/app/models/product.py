from datetime import datetime
from pydantic import BaseModel, Field
from app.models.common import MongoBaseModel, PyObjectId


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    team_id: PyObjectId  # the team responsible for handling complaints on this product


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    team_id: PyObjectId | None = None
    is_active: bool | None = None


class ProductOut(MongoBaseModel):
    name: str
    description: str | None = None
    team_id: PyObjectId
    is_active: bool = True
    created_at: datetime