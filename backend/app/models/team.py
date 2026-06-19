from datetime import datetime
from pydantic import BaseModel, Field
from app.models.common import MongoBaseModel


class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class TeamOut(MongoBaseModel):
    name: str
    description: str | None = None
    created_at: datetime    