from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageStat
from typing import Optional, Tuple


def _parse_hex_color(color_hex: str) -> Tuple[int, int, int]:
    color_hex = color_hex.lstrip('#')
    if len(color_hex) == 3:
        color_hex = ''.join([c * 2 for c in color_hex])
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)
    return r, g, b


def _corner_rois(width: int, height: int, inset: int) -> dict:
    # Define four corner regions of interest
    roi_w = int(width * 0.28)
    roi_h = int(height * 0.22)
    return {
        'br': (width - roi_w - inset, height - roi_h - inset, width - inset, height - inset),
        'bl': (inset, height - roi_h - inset, inset + roi_w, height - inset),
        'tr': (width - roi_w - inset, inset, width - inset, inset + roi_h),
        'tl': (inset, inset, inset + roi_w, inset + roi_h),
    }


def _occupancy_score(img: Image.Image, box: Tuple[int, int, int, int]) -> float:
    # Heuristic: text/logo overlays usually have high edge contrast and low color variance
    crop = img.crop(box).convert('L')
    # Contrast via stddev
    stddev = ImageStat.Stat(crop).stddev[0]
    # Edge intensity
    edges = crop.filter(ImageFilter.FIND_EDGES)
    mean_edges = ImageStat.Stat(edges).mean[0]
    # Normalized score 0..1
    # weights tuned empirically; safe defaults
    score = min(1.0, (stddev / 64.0) * 0.6 + (mean_edges / 64.0) * 0.6)
    return score


def _pick_corner(img: Image.Image, padding_px: int) -> str:
    w, h = img.size
    rois = _corner_rois(w, h, padding_px)
    scores = {corner: _occupancy_score(img, box) for corner, box in rois.items()}
    # Prefer BR -> BL -> TR -> TL while skipping high scores
    order = ['br', 'bl', 'tr', 'tl']
    threshold = 0.45
    for corner in order:
        if scores.get(corner, 1.0) < threshold:
            return corner
    # If all busy, choose the least occupied
    return min(scores, key=scores.get)


def apply_stagecraft_watermark(
    image: Image.Image,
    text: str = "AI staged by StageCraft",
    opacity: float = 0.65,
    padding_px: int = 24,
    min_width_px: int = 800,
    color_hex: str = "#FFFFFF",
    stroke_hex: str = "#000000",
    font_path: Optional[str] = None,
) -> Image.Image:
    """Apply a subtle, corner-aware watermark.

    The function avoids overlapping typical MLS marks by scoring corner occupancy
    and choosing a free corner when possible. It draws text with a thin stroke
    and soft shadow for legibility without a banner box.
    """

    img = image.convert('RGBA')
    w, h = img.size
    if w < min_width_px:
        return image  # Skip small images

    # Decide placement
    corner = _pick_corner(img, padding_px)

    # Dynamic font sizing
    # Clamp between 14px and 22px scaled by width
    size_from_width = max(14, min(int(w * 0.026), 22))
    font = None
    try:
        if font_path:
            font = ImageFont.truetype(font_path, size_from_width)
        else:
            font = ImageFont.truetype("DejaVuSans.ttf", size_from_width)
    except Exception:
        font = ImageFont.load_default()

    # Measure text
    draw_tmp = ImageDraw.Draw(img)
    bbox = draw_tmp.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    # Position
    x, y = padding_px, padding_px
    if corner == 'br':
        x = w - tw - padding_px
        y = h - th - padding_px
    elif corner == 'bl':
        x = padding_px
        y = h - th - padding_px
    elif corner == 'tr':
        x = w - tw - padding_px
        y = padding_px
    # else 'tl' defaults

    # Compose on transparent layer for opacity control
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    fill_r, fill_g, fill_b = _parse_hex_color(color_hex)
    stroke_r, stroke_g, stroke_b = _parse_hex_color(stroke_hex)

    # Soft shadow
    shadow_offset = (1, 1)
    draw.text((x + shadow_offset[0], y + shadow_offset[1]), text,
              font=font, fill=(0, 0, 0, int(180 * opacity)))

    # Stroke
    draw.text((x, y), text, font=font,
              fill=(fill_r, fill_g, fill_b, int(255 * opacity)),
              stroke_width=1, stroke_fill=(stroke_r, stroke_g, stroke_b, int(255 * opacity)))

    out = Image.alpha_composite(img, overlay).convert('RGB')
    return out


