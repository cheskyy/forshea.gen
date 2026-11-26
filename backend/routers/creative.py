"""Creative Assistant: idea capture + AI caption generation."""

import logging
import re
from typing import List

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.ai import chat_text, demo_caption, key_configured
from lib.db import OWNER_ID, db, from_mongo
from models.agents import Idea, IdeaCreate, IdeaPatch

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ideas", response_model=List[Idea])
async def list_ideas():
    docs = await db.ideas.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(100)
    return [Idea(**from_mongo(d, "created_at")) for d in docs]


@router.post("/ideas", response_model=Idea)
async def create_idea(input: IdeaCreate):
    idea = Idea(**input.model_dump())
    await db.ideas.insert_one(idea.model_dump())
    await log_activity("idea", "Ide kreatif disimpan", idea.title)
    return idea


@router.patch("/ideas/{idea_id}", response_model=Idea)
async def patch_idea(idea_id: str, input: IdeaPatch):
    doc = await db.ideas.find_one({"id": idea_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Ide tidak ditemukan.")
    update = input.model_dump(exclude_none=True)
    if update:
        await db.ideas.update_one({"id": idea_id}, {"$set": update})
        doc.update(update)
    return Idea(**from_mongo(doc, "created_at"))


@router.delete("/ideas/{idea_id}", status_code=204)
async def delete_idea(idea_id: str):
    await db.ideas.delete_one({"id": idea_id})
    return None
