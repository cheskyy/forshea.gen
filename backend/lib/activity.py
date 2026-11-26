"""Append-only activity feed — one helper every router uses to record recent events."""

from lib.db import OWNER_ID, db, new_id, now_utc


async def log_activity(type: str, title: str, detail: str = "") -> None:
    await db.activities.insert_one(
        {
            "id": new_id(),
            "owner_id": OWNER_ID,
            "type": type,
            "title": title,
            "detail": detail,
            "created_at": now_utc(),
        }
    )
