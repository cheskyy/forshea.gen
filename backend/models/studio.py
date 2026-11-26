"""Pydantic models for the AI Product Studio (categories, uploads, products, generation)."""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field

from lib.db import OWNER_ID


def new_id() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


# --- Categories -----------------------------------------------------------

class Category(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    slug: str
    group: str = "general"  # clothing | baby | general — decides which styles apply
    subcategories: List[str] = []
    required_slots: List[str] = ["front"]
    custom: bool = False
    created_at: datetime = Field(default_factory=now_utc)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    group: str = "general"
    subcategories: List[str] = []


# --- Uploads ---------------------------------------------------------------

class UploadCreate(BaseModel):
    data_url: str
    filename: str = "photo"
    slot: str = "front"


class UploadMeta(BaseModel):
    id: str
    filename: str
    mime: str
    slot: str
    created_at: datetime


# --- Products ---------------------------------------------------------------

class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category_id: str
    product_type: str = ""
    material: str = ""
    main_color: str = ""
    secondary_color: str = ""
    pattern: str = ""
    dimensions: str = ""
    description: str = ""
    characteristics: str = ""
    upload_ids: List[str] = []


class Product(ProductCreate):
    id: str = Field(default_factory=new_id)
    owner_id: str = OWNER_ID
    category_name: str = ""
    category_group: str = "general"
    created_at: datetime = Field(default_factory=now_utc)


class ProductUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    product_type: str = ""
    material: str = ""
    main_color: str = ""
    secondary_color: str = ""
    pattern: str = ""
    dimensions: str = ""
    description: str = ""
    characteristics: str = ""
    upload_ids: List[str] = []


# --- Generation ---------------------------------------------------------------

class SceneSettings(BaseModel):
    background_color: str = "#F8F5F0"
    background_type: str = ""
    lighting: str = ""
    camera_angle: str = ""
    composition: str = ""
    props: str = ""
    mood: str = ""
    aspect_ratio: str = "1:1"
    custom_prompt: str = ""
    preset: str = ""


class GenerateRequest(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1, le=8)
    style: str
    scene: SceneSettings = Field(default_factory=SceneSettings)


class ImageMeta(BaseModel):
    id: str
    mime: str
    is_mock: bool = False
    favorite: bool = False
    project_id: Optional[str] = None
    product_name: str = ""
    style: str = ""
    created_at: datetime


class ImagePatch(BaseModel):
    favorite: Optional[bool] = None
    project_id: Optional[str] = None  # None = leave unchanged; use explicit JSON null to detach


class Job(BaseModel):
    id: str = Field(default_factory=new_id)
    product_id: str
    product_name: str = ""
    status: str = "processing"  # processing | done | error
    provider: str = "demo"
    quantity: int = 1
    progress: int = 0
    style: str = ""
    scene: SceneSettings = Field(default_factory=SceneSettings)
    result_ids: List[str] = []
    error: str = ""
    created_at: datetime = Field(default_factory=now_utc)
    completed_at: Optional[datetime] = None


class JobDetail(Job):
    images: List[ImageMeta] = []
    originals: List[UploadMeta] = []
