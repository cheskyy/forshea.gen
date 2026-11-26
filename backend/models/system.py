"""Pydantic models for system-level endpoints: settings, dashboard, AI status, projects, activities."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from lib.db import OWNER_ID
from models.studio import new_id, now_utc


# --- Projects & activities ---------------------------------------------------------------

class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = ""


class Project(BaseModel):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    name: str
    description: str = ""
    image_count: int = 0
    created_at: datetime = Field(default_factory=now_utc)


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    detail: str = ""
    created_at: datetime


# --- Settings ---------------------------------------------------------------

class SettingsUpdate(BaseModel):
    owner_name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    theme: Optional[str] = None  # light | dark
    default_quantity: Optional[int] = Field(default=None, ge=1, le=8)
    default_aspect: Optional[str] = None
    monthly_budget: Optional[float] = Field(default=None, ge=0)


class UserSettings(BaseModel):
    id: str = "local"
    owner_name: str = "Forshea"
    theme: str = "light"
    default_quantity: int = 2
    default_aspect: str = "1:1"
    monthly_budget: float = 0
    updated_at: datetime = Field(default_factory=now_utc)


# --- AI status ---------------------------------------------------------------

class AiStatus(BaseModel):
    provider: str  # gemini | demo
    image_model: Optional[str] = None
    key_configured: bool


class CaptionRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    tone: str = "ramah"


class CaptionResult(BaseModel):
    text: str
    hashtags: List[str] = []
    is_mock: bool


class ExplainRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    level: str = "pemula"


class ExplainResult(BaseModel):
    text: str
    is_mock: bool


# --- Dashboard ---------------------------------------------------------------

class GenImagePreview(BaseModel):
    id: str
    product_name: str = ""
    style: str = ""
    is_mock: bool = False
    created_at: datetime


class DashboardSummary(BaseModel):
    owner_name: str
    today: str
    tasks_today: int = 0
    tasks_done_today: int = 0
    images_total: int = 0
    images_today: int = 0
    income_month: float = 0
    expense_month: float = 0
    goals_active: int = 0
    ideas_total: int = 0
    recent_images: List[GenImagePreview] = []
    recent_activities: List[ActivityItem] = []
