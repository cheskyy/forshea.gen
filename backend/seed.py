"""Idempotent seed: product categories + default settings. Run: cd /app/backend && python seed.py"""

import asyncio

from lib.activity import log_activity
from lib.db import OWNER_ID, db, ensure_indexes, new_id, now_utc

CATEGORIES = [
    {
        "name": "Baby Clothing",
        "slug": "baby-clothing",
        "group": "clothing",
        "subcategories": ["Baby romper", "Baby jumpsuit", "Baby pajamas", "Baby dresses", "Baby clothing sets"],
        "required_slots": ["front"],
    },
    {
        "name": "Women's Fashion",
        "slug": "womens-fashion",
        "group": "clothing",
        "subcategories": ["Daster", "Gamis", "Blouses", "Tunics", "Women's pajamas"],
        "required_slots": ["front"],
    },
    {
        "name": "Baby Essentials",
        "slug": "baby-essentials",
        "group": "baby",
        "subcategories": ["Baby bottles", "Baby blankets", "Swaddles", "Baby bags", "Feeding accessories"],
        "required_slots": ["front"],
    },
    {
        "name": "Fashion Accessories",
        "slug": "fashion-accessories",
        "group": "general",
        "subcategories": ["Bags", "Shoes", "Sandals", "Wallets", "Accessories"],
        "required_slots": ["front"],
    },
    {
        "name": "Home & Living",
        "slug": "home-living",
        "group": "general",
        "subcategories": ["Kitchen equipment", "Home decorations", "Household products"],
        "required_slots": ["front"],
    },
    {
        "name": "Other Products",
        "slug": "other-products",
        "group": "general",
        "subcategories": [],
        "required_slots": ["front"],
    },
]


async def seed() -> None:
    await ensure_indexes()

    for cat in CATEGORIES:
        await db.categories.update_one(
            {"slug": cat["slug"]},
            {
                "$set": cat,
                "$setOnInsert": {
                    "id": new_id(),
                    "custom": False,
                    "owner_id": OWNER_ID,
                    "created_at": now_utc(),
                },
            },
            upsert=True,
        )

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

    if await db.activities.count_documents({"type": "system"}) == 0:
        await log_activity("system", "Selamat datang di forshea.gen", "Platform AI personalmu siap digunakan")

    print("seed ok")


if __name__ == "__main__":
    asyncio.run(seed())
