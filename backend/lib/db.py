"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

# Single-user personal mode — auth can slot in later by swapping this for a real user id.
OWNER_ID = "local"

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]


def new_id() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    """Aware UTC now — store aware so Pydantic serialises the offset for JS."""
    return datetime.now(timezone.utc)


def from_mongo(doc: dict | None, *fields: str) -> dict | None:
    """Normalise a raw Mongo doc for Pydantic: drop _id, make naive datetimes aware-UTC."""
    if doc is None:
        return None
    doc.pop("_id", None)
    for field in fields:
        value = doc.get(field)
        if isinstance(value, datetime) and value.tzinfo is None:
            doc[field] = value.replace(tzinfo=timezone.utc)
    return doc

logger = logging.getLogger(__name__)

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "categories": [IndexModel([("slug", ASCENDING)], name="slug", unique=True)],
    "uploads": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
        IndexModel([("slot", ASCENDING)], name="slot"),
    ],
    "products": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "generation_jobs": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "images": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
        IndexModel([("job_id", ASCENDING)], name="job"),
        IndexModel([("project_id", ASCENDING)], name="project"),
        IndexModel([("favorite", ASCENDING)], name="favorite"),
    ],
    "projects": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "activities": [
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "tasks": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("due_date", ASCENDING)], name="owner_due"),
    ],
    "daily_notes": [IndexModel([("date", ASCENDING)], name="date", unique=True)],
    "transactions": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("occurred_date", DESCENDING)], name="owner_date"),
    ],
    "learning_goals": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "ideas": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("owner_id", ASCENDING), ("created_at", DESCENDING)], name="owner_created"),
    ],
    "settings": [IndexModel([("id", ASCENDING)], name="id", unique=True)],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)
