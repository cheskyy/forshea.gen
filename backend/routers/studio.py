"""AI Product Studio: product specs, generation jobs (background), job polling."""

import asyncio
import base64
import logging
from typing import List

from fastapi import APIRouter, HTTPException

from lib.activity import log_activity
from lib.ai import (
    build_generation_prompt,
    demo_product_svg,
    generate_product_image,
    provider_name,
)
from lib.db import OWNER_ID, db, from_mongo, new_id, now_utc
from lib.dates import today_iso
from models.studio import (
    GenerateRequest,
    ImageMeta,
    Job,
    JobDetail,
    Product,
    ProductCreate,
    ProductUpdate,
    UploadMeta,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _image_meta(doc: dict) -> ImageMeta:
    return ImageMeta(**from_mongo({k: v for k, v in doc.items() if k != "data_b64"}, "created_at"))


@router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    cat = await db.categories.find_one({"id": input.category_id})
    if not cat:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
    product = Product(**input.model_dump(), category_name=cat["name"], category_group=cat["group"])
    await db.products.insert_one(product.model_dump())
    await log_activity("product", "Produk disimpan", f"{product.name} - {cat['name']}")
    return product


@router.get("/products", response_model=List[Product])
async def list_products(limit: int = 30):
    docs = await db.products.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(min(limit, 100))
    return [Product(**from_mongo(d, "created_at")) for d in docs]


@router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, input: ProductUpdate):
    doc = await db.products.find_one({"id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan.")
    await db.products.update_one({"id": product_id}, {"$set": input.model_dump()})
    doc.update(input.model_dump())
    return Product(**from_mongo(doc, "created_at"))


@router.post("/generate", response_model=Job)
async def start_generation(input: GenerateRequest):
    product = await db.products.find_one({"id": input.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan. Simpan spesifikasi produk dulu.")
    job = Job(
        product_id=product["id"],
        product_name=product["name"],
        provider=provider_name(),
        quantity=input.quantity,
        style=input.style,
        scene=input.scene,
    )
    await db.generation_jobs.insert_one(job.model_dump())
    asyncio.create_task(_run_job(job.id))  # returns immediately; the frontend polls the job
    return job


async def _run_job(job_id: str) -> None:
    try:
        job_doc = from_mongo(await db.generation_jobs.find_one({"id": job_id}), "created_at")
        product = await db.products.find_one({"id": job_doc["product_id"]})
        scene = job_doc["scene"]
        style = job_doc["style"]

        refs: list[str] = []
        for upload_id in (product.get("upload_ids") or [])[:4]:
            up = await db.uploads.find_one({"id": upload_id})
            if up:
                refs.append(up["data_b64"])

        prompt = build_generation_prompt(product, style, scene, product.get("category_group", "general"))
        result_ids: list[str] = []
        for i in range(job_doc["quantity"]):
            if job_doc["provider"] == "gemini":
                data, mime = await generate_product_image(prompt, refs)
                is_mock = False
            else:
                data, mime = demo_product_svg(product.get("name", ""), style, scene, i, job_doc["quantity"])
                is_mock = True
            img = {
                "id": new_id(),
                "owner_id": OWNER_ID,
                "job_id": job_id,
                "product_id": product["id"],
                "mime": mime,
                "data_b64": base64.b64encode(data).decode("ascii"),
                "is_mock": is_mock,
                "favorite": False,
                "project_id": None,
                "product_name": product.get("name", ""),
                "style": style,
                "created_at": now_utc(),
                "created_date": today_iso(),
            }
            await db.images.insert_one(img)
            result_ids.append(img["id"])
            await db.generation_jobs.update_one(
                {"id": job_id}, {"$set": {"progress": i + 1, "result_ids": result_ids}}
            )
        await db.generation_jobs.update_one(
            {"id": job_id}, {"$set": {"status": "done", "completed_at": now_utc()}}
        )
        await log_activity(
            "generation", "Foto produk selesai dibuat", f"{len(result_ids)} gambar untuk {product.get('name', '')}"
        )
    except Exception as exc:
        logger.error("generation job %s failed: %s", job_id, exc)
        raw = str(exc)
        if "Budget has been exceeded" in raw or "RateLimitError" in raw:
            message = (
                "Saldo AI key habis. Isi ulang saldo Universal Key (Profil > Universal Key > Add Balance), "
                "lalu coba lagi. Gambar yang sudah jadi tetap tersimpan."
            )
        elif "AI tidak mengembalikan gambar" in raw:
            message = raw[:400]
        else:
            message = "Gagal membuat gambar. Coba lagi sebentar lagi."
        await db.generation_jobs.update_one(
            {"id": job_id},
            {"$set": {"status": "error", "error": message, "completed_at": now_utc()}},
        )


@router.get("/generate/{job_id}", response_model=JobDetail)
async def get_job(job_id: str):
    doc = from_mongo(await db.generation_jobs.find_one({"id": job_id}), "created_at", "completed_at")
    if not doc:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    images = await db.images.find({"job_id": job_id}).sort("created_at", 1).to_list(20)
    product = await db.products.find_one({"id": doc["product_id"]})
    originals: list[UploadMeta] = []
    for upload_id in (product.get("upload_ids") or []) if product else []:
        up = await db.uploads.find_one({"id": upload_id})
        if up:
            originals.append(UploadMeta(**from_mongo(up, "created_at")))
    return JobDetail(
        images=[_image_meta(i) for i in images],
        originals=originals,
        **doc,
    )
