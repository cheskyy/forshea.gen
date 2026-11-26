"""Uploads (reference photos) and generated image files — bytes live in Mongo as base64."""

import base64
import re

from fastapi import APIRouter, HTTPException, Response

from lib.activity import log_activity
from lib.db import OWNER_ID, db, from_mongo, new_id, now_utc
from models.studio import ImageMeta, ImagePatch, UploadCreate, UploadMeta

router = APIRouter()

ALLOWED_MIME = {"image/png", "image/jpeg", "image/webp"}
MAX_BYTES = 6 * 1024 * 1024  # 6MB per image


def _parse_data_url(data_url: str) -> tuple[str, str]:
    match = re.match(r"^data:([\w.+-]+/[\w.+-]+);base64,(.+)$", data_url, re.S)
    if not match:
        raise HTTPException(status_code=400, detail="Format gambar tidak valid.")
    mime, b64 = match.group(1), match.group(2)
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Format harus PNG, JPG, atau WebP.")
    try:
        raw = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Data gambar rusak.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran gambar maksimal 6MB.")
    return mime, b64


def _file_response(doc: dict) -> Response:
    return Response(
        content=base64.b64decode(doc["data_b64"]),
        media_type=doc["mime"],
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# --- Reference photo uploads -------------------------------------------------

@router.post("/uploads", response_model=UploadMeta)
async def create_upload(input: UploadCreate):
    mime, b64 = _parse_data_url(input.data_url)
    meta = UploadMeta(
        id=new_id(),
        filename=(input.filename or "photo")[:120],
        mime=mime,
        slot=input.slot[:40],
        created_at=now_utc(),
    )
    await db.uploads.insert_one(
        {
            "id": meta.id,
            "owner_id": OWNER_ID,
            "filename": meta.filename,
            "mime": mime,
            "slot": meta.slot,
            "data_b64": b64,
            "created_at": meta.created_at,
        }
    )
    return meta


@router.get("/uploads", response_model=list[UploadMeta])
async def list_uploads():
    docs = await db.uploads.find({"owner_id": OWNER_ID}).sort("created_at", -1).to_list(200)
    return [UploadMeta(**from_mongo(d, "created_at")) for d in docs]


@router.get("/uploads/{upload_id}/file")
async def upload_file(upload_id: str):
    doc = await db.uploads.find_one({"id": upload_id})
    if not doc:
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    return _file_response(doc)


@router.delete("/uploads/{upload_id}", status_code=204)
async def delete_upload(upload_id: str):
    await db.uploads.delete_one({"id": upload_id})
    return None


# --- Generated images ---------------------------------------------------------

@router.get("/images", response_model=list[ImageMeta])
async def list_images(favorite: bool | None = None, project_id: str | None = None, limit: int = 60):
    query: dict = {"owner_id": OWNER_ID}
    if favorite is not None:
        query["favorite"] = favorite
    if project_id:
        query["project_id"] = project_id
    docs = await db.images.find(query).sort("created_at", -1).to_list(min(limit, 200))
    return [ImageMeta(**from_mongo(d, "created_at")) for d in docs]


@router.get("/images/{image_id}/file")
async def image_file(image_id: str):
    doc = await db.images.find_one({"id": image_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Gambar tidak ditemukan.")
    return _file_response(doc)


@router.patch("/images/{image_id}", response_model=ImageMeta)
async def patch_image(image_id: str, input: ImagePatch):
    doc = await db.images.find_one({"id": image_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Gambar tidak ditemukan.")
    update: dict = {}
    if input.favorite is not None:
        update["favorite"] = input.favorite
    if input.project_id is not None:
        update["project_id"] = input.project_id or None  # "" detaches from the project
    if update:
        await db.images.update_one({"id": image_id}, {"$set": update})
        doc.update(update)
    return ImageMeta(**from_mongo({k: v for k, v in doc.items() if k != "data_b64"}, "created_at"))


@router.delete("/images/{image_id}", status_code=204)
async def delete_image(image_id: str):
    await log_activity("gallery", "Gambar dihapus dari galeri")
    await db.images.delete_one({"id": image_id})
    return None
