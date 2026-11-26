"""My Workspace: projects (image collections) + the recent activity feed."""

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from lib.activity import log_activity
from lib.db import OWNER_ID, db, from_mongo, new_id, now_utc
from models.system import ActivityItem, Project, ProjectCreate

router = APIRouter()


class ProjectPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    description: Optional[str] = None


@router.get("/projects", response_model=list[Project])
async def list_projects():
    docs = await db.projects.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(100)
    out: list[Project] = []
    for doc in docs:
        doc["image_count"] = await db.images.count_documents({"project_id": doc["id"]})
        out.append(Project(**from_mongo(doc, "created_at")))
    return out


@router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    project = Project(**input.model_dump())
    await db.projects.insert_one(project.model_dump())
    await log_activity("project", "Proyek dibuat", project.name)
    return project


@router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, input: ProjectPatch):
    doc = await db.projects.find_one({"id": project_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Proyek tidak ditemukan.")
    update = input.model_dump(exclude_none=True)
    if update:
        await db.projects.update_one({"id": project_id}, {"$set": update})
        doc.update(update)
    doc["image_count"] = await db.images.count_documents({"project_id": project_id})
    return Project(**from_mongo(doc, "created_at"))


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project(project_id: str):
    # Images are detached, not destroyed — the project folder is the only thing removed.
    await db.images.update_many({"project_id": project_id}, {"$set": {"project_id": None}})
    await db.projects.delete_one({"id": project_id})
    return None


@router.get("/activities", response_model=list[ActivityItem])
async def list_activities(limit: int = 20):
    docs = await db.activities.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(min(limit, 50))
    return [ActivityItem(**from_mongo(d, "created_at")) for d in docs]
