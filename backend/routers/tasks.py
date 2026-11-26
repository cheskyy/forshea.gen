"""Daily Assistant: tasks, priorities, and per-day notes."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.db import OWNER_ID, db, from_mongo, new_id, now_utc
from lib.dates import today_iso
from models.agents import DailyNote, NoteBody, Task, TaskCreate, TaskPatch

router = APIRouter()


def _task(doc: dict) -> Task:
    return Task(**from_mongo(doc, "created_at", "done_at"))


@router.get("/tasks", response_model=list[Task])
async def list_tasks(date: Optional[str] = None, done: Optional[bool] = None):
    query: dict = {"owner_id": OWNER_ID}
    if date:
        query["due_date"] = date
    if done is not None:
        query["done"] = done
    docs = await db.tasks.find(query).sort("created_at", 1).to_list(300)
    return [_task(d) for d in docs]


@router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate):
    if input.priority not in ("rendah", "sedang", "tinggi"):
        raise HTTPException(status_code=400, detail="Prioritas tidak valid.")
    data = input.model_dump()
    data["due_date"] = data["due_date"] or today_iso()
    task = Task(**data)
    await db.tasks.insert_one(task.model_dump())
    await log_activity("task", "Tugas ditambahkan", task.title)
    return _task(task.model_dump())


@router.patch("/tasks/{task_id}", response_model=Task)
async def patch_task(task_id: str, input: TaskPatch):
    doc = await db.tasks.find_one({"id": task_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan.")
    update = input.model_dump(exclude_none=True)
    if "done" in update:
        update["done_at"] = now_utc() if update["done"] else None
    if update:
        await db.tasks.update_one({"id": task_id}, {"$set": update})
        doc.update(update)
    return _task(doc)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str):
    await db.tasks.delete_one({"id": task_id})
    return None


@router.get("/notes/{note_date}", response_model=DailyNote)
async def get_note(note_date: str):
    doc = await db.daily_notes.find_one({"date": note_date})
    if not doc:
        return DailyNote(id="", date=note_date, content="")
    return DailyNote(**from_mongo(doc, "updated_at"))


@router.put("/notes/{note_date}", response_model=DailyNote)
async def put_note(note_date: str, input: NoteBody):
    await db.daily_notes.update_one(
        {"date": note_date},
        {
            "$set": {"content": input.content, "updated_at": now_utc()},
            "$setOnInsert": {"id": new_id(), "owner_id": OWNER_ID},
        },
        upsert=True,
    )
    doc = await db.daily_notes.find_one({"date": note_date})
    return DailyNote(**from_mongo(doc, "updated_at"))
