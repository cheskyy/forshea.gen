"""Expandable product category system."""

import re

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.db import db, from_mongo, new_id, now_utc
from models.studio import Category, CategoryCreate

router = APIRouter()

GROUPS = ("clothing", "baby", "general")


def _slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or f"custom-{new_id()[:8]}"


@router.get("/categories", response_model=list[Category])
async def list_categories():
    docs = await db.categories.find().sort("created_at", 1).to_list(100)
    return [Category(**from_mongo(d, "created_at")) for d in docs]


@router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    slug = _slug(input.name)
    existing = await db.categories.find_one({"slug": slug})
    if existing:
        return Category(**from_mongo(existing, "created_at"))
    cat = Category(
        name=input.name,
        slug=slug,
        group=input.group if input.group in GROUPS else "general",
        subcategories=input.subcategories,
        required_slots=["front"],
        custom=True,
    )
    await db.categories.insert_one(cat.model_dump())
    await log_activity("category", "Kategori baru ditambahkan", cat.name)
    return cat
