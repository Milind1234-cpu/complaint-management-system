from datetime import datetime
from typing import Annotated
from bson import ObjectId
from pydantic import BeforeValidator, BaseModel, Field

PyObjectId = Annotated[str, BeforeValidator(str)]


def utc_now() -> datetime:
    return datetime.utcnow()


class MongoBaseModel(BaseModel):
    id: PyObjectId | None = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}