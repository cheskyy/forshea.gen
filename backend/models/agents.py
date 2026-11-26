"""Pydantic models for the four personal agents: tasks, finance, learning, creative."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from lib.db import OWNER_ID
from models.studio import new_id, now_utc


# --- Daily Assistant ---------------------------------------------------------------

class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    priority: str = "sedang"  # rendah | sedang | tinggi
    due_date: str = ""  # YYYY-MM-DD, defaults to today (server-side)
    notes: str = ""


class TaskPatch(BaseModel):
    title: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    done: Optional[bool] = None


class Task(BaseModel):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    title: str
    priority: str = "sedang"
    due_date: str
    notes: str = ""
    done: bool = False
    done_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now_utc)


class NoteBody(BaseModel):
    content: str = ""


class DailyNote(BaseModel):
    id: str
    owner_id: str = OWNER_ID
    date: str
    content: str
    updated_at: datetime = Field(default_factory=now_utc)


# --- Finance Assistant ---------------------------------------------------------------

class TransactionCreate(BaseModel):
    type: str  # income | expense
    amount: float = Field(gt=0)
    category: str = "Lainnya"
    note: str = ""
    occurred_date: str = ""  # YYYY-MM-DD, defaults to today (server-side)


class Transaction(BaseModel):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    type: str
    amount: float
    category: str
    note: str = ""
    occurred_date: str
    created_at: datetime = Field(default_factory=now_utc)


class CategoryTotal(BaseModel):
    name: str
    type: str
    total: float


class WeekPoint(BaseModel):
    label: str
    income: float
    expense: float


class FinanceSummary(BaseModel):
    income_month: float = 0
    expense_month: float = 0
    income_week: float = 0
    expense_week: float = 0
    budget: float = 0
    by_category: List[CategoryTotal] = []
    weekly: List[WeekPoint] = []


# --- Learning Assistant ---------------------------------------------------------------

class GoalCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    subject: str = ""
    target_date: str = ""
    notes: str = ""


class GoalPatch(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    target_date: Optional[str] = None
    notes: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)


class LearningGoal(BaseModel):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    title: str
    subject: str = ""
    target_date: str = ""
    progress: int = 0
    notes: str = ""
    created_at: datetime = Field(default_factory=now_utc)


# --- Creative Assistant ---------------------------------------------------------------

class IdeaCreate(BaseModel):
    kind: str = "brainstorm"  # brainstorm | caption | konten
    title: str = Field(min_length=2, max_length=160)
    content: str = ""


class IdeaPatch(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    kind: Optional[str] = None


class Idea(BaseModel):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    kind: str = "brainstorm"
    title: str
    content: str = ""
    created_at: datetime = Field(default_factory=now_utc)
