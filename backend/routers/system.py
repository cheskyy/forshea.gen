"""System endpoints: settings, dashboard summary, AI provider status + chat helpers."""

import logging
import re

from fastapi import APIRouter

from lib.ai import (
    IMAGE_MODEL,
    chat_text,
    demo_caption,
    demo_explain,
    key_configured,
    provider_name,
)
from lib.db import OWNER_ID, db, from_mongo, now_utc
from lib.dates import today_iso
from models.system import (
    ActivityItem,
    AiStatus,
    CaptionRequest,
    CaptionResult,
    DashboardSummary,
    ExplainRequest,
    ExplainResult,
    GenImagePreview,
    SettingsUpdate,
    UserSettings,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def _settings_doc() -> dict:
    doc = await db.settings.find_one({"id": "local"})
    if not doc:
        await db.settings.update_one(
            {"id": "local"},
            {
                "$setOnInsert": {
                    "id": "local",
                    "owner_name": "Forshea",
                    "theme": "light",
                    "default_quantity": 2,
                    "default_aspect": "1:1",
                    "monthly_budget": 0,
                    "updated_at": now_utc(),
                }
            },
            upsert=True,
        )
        doc = await db.settings.find_one({"id": "local"})
    return doc


@router.get("/settings", response_model=UserSettings)
async def get_settings():
    return UserSettings(**from_mongo(await _settings_doc(), "updated_at"))


@router.put("/settings", response_model=UserSettings)
async def put_settings(input: SettingsUpdate):
    await _settings_doc()
    update = input.model_dump(exclude_none=True)
    if update:
        update["updated_at"] = now_utc()
        await db.settings.update_one({"id": "local"}, {"$set": update})
    return UserSettings(**from_mongo(await db.settings.find_one({"id": "local"}), "updated_at"))


@router.get("/ai/status", response_model=AiStatus)
async def ai_status():
    configured = key_configured()
    return AiStatus(
        provider=provider_name(),
        image_model=IMAGE_MODEL if configured else None,
        key_configured=configured,
    )


@router.post("/ai/caption", response_model=CaptionResult)
async def ai_caption(input: CaptionRequest):
    if key_configured():
        try:
            text = await chat_text(
                "You are forshea.gen's creative assistant. Write in Indonesian, concise and persuasive for Shopee listings.",
                f"Buat 1 caption produk untuk listing Shopee tentang: {input.topic}. Nuansa: {input.tone}. "
                "Tulis caption-nya saja, akhiri dengan 5 hashtag relevan.",
            )
            hashtags = re.findall(r"#\w+", text)
            return CaptionResult(text=text, hashtags=hashtags, is_mock=False)
        except Exception as exc:
            logger.error("caption generation failed, using demo: %s", exc)
    text, hashtags = demo_caption(input.topic, input.tone)
    return CaptionResult(text=text, hashtags=hashtags, is_mock=True)


@router.post("/ai/explain", response_model=ExplainResult)
async def ai_explain(input: ExplainRequest):
    if key_configured():
        try:
            text = await chat_text(
                "You are forshea.gen's learning assistant. Explain clearly in Indonesian for the requested level.",
                f"Jelaskan topik berikut secara ringkas dan terstruktur (level {input.level}): {input.topic}. "
                "Gunakan poin-poin dan contoh sederhana.",
            )
            return ExplainResult(text=text, is_mock=False)
        except Exception as exc:
            logger.error("explain generation failed, using demo: %s", exc)
    return ExplainResult(text=demo_explain(input.topic), is_mock=True)


@router.get("/dashboard", response_model=DashboardSummary)
async def dashboard():
    today = today_iso()
    month_prefix = today[:7]

    owner_name = (await _settings_doc()).get("owner_name", "Forshea")

    tasks_today = await db.tasks.count_documents({"owner_id": OWNER_ID, "due_date": today})
    tasks_done_today = await db.tasks.count_documents({"owner_id": OWNER_ID, "due_date": today, "done": True})
    images_total = await db.images.count_documents({})
    images_today = await db.images.count_documents({"created_date": today})

    txns = await db.transactions.find(
        {"owner_id": OWNER_ID, "occurred_date": {"$gte": f"{month_prefix}-01", "$lte": f"{month_prefix}-31"}}
    ).to_list(2000)
    income_month = sum(t["amount"] for t in txns if t["type"] == "income")
    expense_month = sum(t["amount"] for t in txns if t["type"] == "expense")

    goals_active = await db.learning_goals.count_documents({"owner_id": OWNER_ID, "progress": {"$lt": 100}})
    ideas_total = await db.ideas.count_documents({})

    image_docs = await db.images.find().sort("created_at", -1).to_list(8)
    recent_images = [
        GenImagePreview(**from_mongo({k: v for k, v in d.items() if k != "data_b64"}, "created_at"))
        for d in image_docs
    ]
    activity_docs = await db.activities.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(8)
    recent_activities = [ActivityItem(**from_mongo(d, "created_at")) for d in activity_docs]

    return DashboardSummary(
        owner_name=owner_name,
        today=today,
        tasks_today=tasks_today,
        tasks_done_today=tasks_done_today,
        images_total=images_total,
        images_today=images_today,
        income_month=income_month,
        expense_month=expense_month,
        goals_active=goals_active,
        ideas_total=ideas_total,
        recent_images=recent_images,
        recent_activities=recent_activities,
    )
