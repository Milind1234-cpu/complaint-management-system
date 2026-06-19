from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.common import MongoBaseModel, PyObjectId


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ActivityLogEntry(BaseModel):
    action: str  # e.g. "created", "status_changed", "assigned", "comment_added"
    detail: str
    actor_id: PyObjectId
    actor_name: str
    timestamp: datetime


class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=3000)
    product_id: PyObjectId
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    comment: str | None = None


class TicketReassign(BaseModel):
    assigned_to: PyObjectId


class TicketCommentCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)


class TicketOut(MongoBaseModel):
    title: str
    description: str
    product_id: PyObjectId
    product_name: str | None = None
    team_id: PyObjectId | None = None
    status: TicketStatus
    priority: TicketPriority
    created_by: PyObjectId
    created_by_name: str | None = None
    assigned_to: PyObjectId | None = None
    assigned_to_name: str | None = None
    activity_log: list[ActivityLogEntry] = []
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    closed_at: datetime | None = None