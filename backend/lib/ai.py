"""AI provider abstraction — real Gemini generation when a key exists, clearly-labeled demo otherwise."""

import base64
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape as _esc

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

IMAGE_MODEL = os.environ.get("AI_IMAGE_MODEL", "gemini-3.1-flash-image-preview")


def key_configured() -> bool:
    return bool(os.environ.get("EMERGENT_LLM_KEY", "").strip())


def provider_name() -> str:
    return "gemini" if key_configured() else "demo"


async def generate_product_image(prompt: str, reference_b64: list[str]) -> tuple[bytes, str]:
    """One product image via Gemini image model, using uploaded photos as the source of truth."""
    from emergentintegrations.llm.chat import ImageContent, LlmChat, UserMessage

    api_key = os.environ["EMERGENT_LLM_KEY"]
    chat = LlmChat(
        api_key=api_key,
        session_id=f"forshea-gen-{uuid.uuid4()}",
        system_message=(
            "You are forshea.gen, a professional product photography AI for marketplace "
            "listings. You always preserve the exact product from the reference photos."
        ),
    )
    chat.with_model("gemini", IMAGE_MODEL).with_params(modalities=["image", "text"])

    file_contents = [ImageContent(b64) for b64 in reference_b64]
    msg = UserMessage(text=prompt, file_contents=file_contents)
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        detail = (text or "").strip()[:250]
        raise RuntimeError(
            "AI tidak mengembalikan gambar"
            + (f": {detail}" if detail else "")
        )
    first = images[0]
    return base64.b64decode(first["data"]), first.get("mime_type", "image/png")


async def chat_text(system: str, prompt: str) -> str:
    """Short text generation (captions, explanations). Raises when no key is configured."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    if not key_configured():
        raise RuntimeError("no key")
    api_key = os.environ["EMERGENT_LLM_KEY"]
    chat = LlmChat(api_key=api_key, session_id=f"forshea-text-{uuid.uuid4()}", system_message=system)
    msg = UserMessage(text=prompt)
    text, _images = await chat.send_message_multimodal_response(msg)
    return text or ""


FIDELITY_RULES = {
    "clothing": [
        "Do not change the garment pattern, print, or embroidery.",
        "Do not add or remove buttons, zippers, pockets, or trims.",
        "Preserve the sleeve length and the garment silhouette exactly.",
        "Preserve fabric texture and the original colors.",
    ],
    "baby": [
        "Preserve the original product design exactly.",
        "Do not invent safety certifications, labels, or claims.",
        "Do not change product dimensions or functional components.",
    ],
    "general": [
        "Preserve the product's shape, proportions, material finish, and logo placement.",
        "Do not invent product features or accessories that are not in the reference photos.",
    ],
}


def build_generation_prompt(spec: dict, style: str, scene: dict, group: str) -> str:
    """One detailed prompt that keeps the uploaded product as the single source of truth."""
    rules = "\n".join(f"- {rule}" for rule in FIDELITY_RULES.get(group, FIDELITY_RULES["general"]))
    spec_bits = ", ".join(
        f"{key}: {spec[key]}"
        for key in ("product_type", "material", "main_color", "secondary_color", "pattern", "dimensions")
        if spec.get(key)
    )
    scene_bits = ", ".join(
        f"{key}: {scene[key]}"
        for key in ("background_color", "background_type", "lighting", "camera_angle", "composition", "props", "mood")
        if scene.get(key)
    )
    custom = f"\nAdditional art direction from the owner: {scene['custom_prompt']}" if scene.get("custom_prompt") else ""
    return (
        "Generate ONE professional e-commerce product photograph (aspect ratio "
        f"{scene.get('aspect_ratio', '1:1')}, suitable for a Shopee catalog) of the EXACT product "
        "shown in the reference photos.\n\n"
        f"Product: {spec.get('name', 'product')}"
        + (f" ({spec_bits})" if spec_bits else "")
        + (f". Description: {spec['description']}" if spec.get("description") else "")
        + (f". Special characteristics: {spec['characteristics']}" if spec.get("characteristics") else "")
        + f"\nPhotography style: {style}.\n"
        + (f"Scene: {scene_bits}.\n" if scene_bits else "")
        + custom
        + "\n\nPRODUCT FIDELITY RULES — highest priority:\n"
        + rules
        + "\n- The reference photos are the source of truth; the photographed item must remain the same product."
        + "\n- If any feature cannot be reliably preserved, keep the product plain and do not invent details."
        + "\nReturn only the final image."
    )


def demo_product_svg(product_name: str, style: str, scene: dict, index: int, total: int) -> tuple[bytes, str]:
    """Mock result: an elegant, unmistakably labeled DEMO placeholder (no AI involved)."""
    bg = scene.get("background_color") or "#F8F5F0"
    name = _esc(product_name or "Foto Produk")
    style_line = _esc(f"{style} - {index + 1}/{total}")
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="{_esc(bg)}"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <circle cx="512" cy="420" r="235" fill="#9B8264" opacity="0.13"/>
  <circle cx="512" cy="420" r="165" fill="#9B8264" opacity="0.15"/>
  <g transform="translate(427,315)" opacity="0.5">
    <rect x="0" y="0" width="170" height="210" rx="20" fill="#9B8264"/>
    <rect x="30" y="40" width="110" height="10" rx="5" fill="#FCFBF9"/>
    <rect x="30" y="70" width="70" height="10" rx="5" fill="#FCFBF9" opacity="0.7"/>
  </g>
  <text x="512" y="705" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="#252525">{name}</text>
  <text x="512" y="752" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#6E6961">{style_line}</text>
  <rect x="282" y="812" width="460" height="54" rx="27" fill="#F3EBDD" stroke="#E2D3B8"/>
  <circle cx="314" cy="839" r="7" fill="#C07616"/>
  <text x="522" y="848" text-anchor="middle" font-family="Arial, sans-serif" font-size="21" font-weight="bold" fill="#7A4D14">HASIL DEMO — BUKAN GAMBAR AI</text>
  <text x="512" y="940" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" fill="#9A9188">Mode demo aktif — hubungkan AI provider di Pengaturan untuk hasil nyata</text>
</svg>"""
    return svg.encode("utf-8"), "image/svg+xml"


def demo_caption(topic: str, tone: str) -> tuple[str, list[str]]:
    text = (
        f"[DEMO] Caption untuk \"{topic}\" dengan nuansa {tone}: "
        "\"Produk favorit baru yang siap menemani harimu — nyaman, berkualitas, dan harganya bersahabat. "
        "Checkout sekarang sebelum kehabisan!\" — Ini hasil mode demo, bukan teks AI asli."
    )
    hashtags = ["#DEMO", "#produklokal", "#shopeeindonesia", "#onlineshop", "#forsheagen"]
    return text, hashtags


def demo_explain(topic: str) -> str:
    return (
        f"[DEMO] Penjelasan untuk \"{topic}\" (mode demo, bukan AI asli):\n\n"
        "1. Pahami tujuan belajarmu — tuliskan apa yang ingin kamu kuasai dari topik ini.\n"
        "2. Pecah topik menjadi 3-5 sub-bagian kecil dan pelajari satu per satu.\n"
        "3. Uji pemahamanmu dengan membuat rangkasan singkat dengan bahasamu sendiri.\n\n"
        "Hubungkan AI provider di Pengaturan untuk mendapat penjelasan AI yang nyata."
    )


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
