"""Learning Assistant: goals with progress tracking."""

from typing import List

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.db import OWNER_ID, db, from_mongo
from models.agents import GoalCreate, GoalPatch, LearningGoal

router = APIRouter()


@router.get("/learning-goals", response_model=List[LearningGoal])
async def list_goals():
    docs = await db.learning_goals.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(100)
    return [LearningGoal(**from_mongo(d, "created_at")) for d in docs]


@router.post("/learning-goals", response_model=LearningGoal)
async def create_goal(input: GoalCreate):
    goal = LearningGoal(**input.model_dump())
    await db.learning_goals.insert_one(goal.model_dump())
    await log_activity("goal", "Tujuan belajar dibuat", goal.title)
    return goal


@router.patch("/learning-goals/{goal_id}", response_model=LearningGoal)
async def patch_goal(goal_id: str, input: GoalPatch):
    doc = await db.learning_goals.find_one({"id": goal_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Tujuan tidak ditemukan.")
    update = input.model_dump(exclude_none=True)
    if update:
        await db.learning_goals.update_one({"id": goal_id}, {"$set": update})
        doc.update(update)
    return LearningGoal(**from_mongo(doc, "created_at"))


@router.delete("/learning-goals/{goal_id}", status_code=204)
async def delete_goal(goal_id: str):
    await db.learning_goals.delete_one({"id": goal_id})
    return None
