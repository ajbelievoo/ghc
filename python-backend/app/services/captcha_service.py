"""Self-hosted math-image CAPTCHA — no external keys required.

Generates a small arithmetic puzzle rendered as a PNG (PIL) and stores the
expected answer in-process with a short TTL. Answers are single-use: any
verification attempt consumes the captcha so it cannot be replayed or
brute-forced repeatedly.
"""

import base64
import io
import random
import secrets
import time

from PIL import Image, ImageDraw, ImageFont

_TTL_SECONDS = 300
_store: dict[str, tuple[int, float]] = {}

_POOL = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def _fonts() -> list[ImageFont.FreeTypeFont]:
    out = []
    for path in _POOL:
        try:
            out.append(ImageFont.truetype(path, size=random.randint(24, 30)))
        except OSError:
            continue
    return out or [ImageFont.load_default()] * 3


def _puzzle() -> tuple[str, int]:
    a, b = random.randint(2, 19), random.randint(2, 19)
    op = random.choice("+-*")
    if op == "-":
        a, b = max(a, b), min(a, b)
    return f"{a} {op} {b} = ?", eval(f"{a}{op}{b}")


def _render(text: str) -> str:
    img = Image.new("RGB", (180, 60), (15, 23, 42))
    d = ImageDraw.Draw(img)
    for _ in range(5):
        d.line(
            [(random.randint(0, 180), random.randint(0, 60)) for _ in range(2)],
            fill=(random.randint(40, 90), random.randint(120, 200), random.randint(160, 255)),
            width=1,
        )
    fonts = _fonts()
    x = 14
    for ch in text:
        font = random.choice(fonts)
        color = (random.randint(180, 255), random.randint(180, 255), random.randint(180, 255))
        d.text((x, random.randint(8, 22)), ch, font=font, fill=color)
        x += int(random.uniform(11, 15))
    for _ in range(60):
        d.point((random.randint(0, 179), random.randint(0, 59)), fill=(148, 163, 184))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _sweep() -> None:
    now = time.time()
    for cid in [k for k, (_, exp) in _store.items() if exp < now]:
        _store.pop(cid, None)


def generate() -> dict:
    _sweep()
    text, answer = _puzzle()
    cid = secrets.token_urlsafe(16)
    _store[cid] = (answer, time.time() + _TTL_SECONDS)
    return {"captchaId": cid, "image": f"data:image/png;base64,{_render(text)}"}


def verify(captcha_id: str | None, answer: str | None) -> bool:
    if not captcha_id or not answer:
        return False
    entry = _store.pop(captcha_id, None)  # single-use
    if not entry or entry[1] < time.time():
        return False
    try:
        return int(str(answer).strip()) == entry[0]
    except ValueError:
        return False
