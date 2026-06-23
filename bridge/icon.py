"""
Generates the TRAX Bridge app icon as a PIL Image.
Used by both the system tray and PyInstaller.
"""

from PIL import Image, ImageDraw, ImageFont
import os


def make_icon(size: int = 64, connected: bool = True) -> Image.Image:
    """
    Draw a rounded-square icon: dark background, purple 'T' letter,
    small green/grey dot in the corner for connection state.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded background
    radius = size // 6
    bg_color = (17, 17, 24, 255)          # #111118
    _rounded_rect(draw, 0, 0, size, size, radius, bg_color)

    # Purple accent border
    accent = (108, 99, 255, 180)           # #6c63ff semi
    _rounded_rect_outline(draw, 1, 1, size - 2, size - 2, radius, accent, width=max(1, size // 32))

    # Letter "T" centered
    letter_color = (232, 232, 240, 255)    # #e8e8f0
    font_size = int(size * 0.52)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "T", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - bbox[0]
    ty = (size - th) // 2 - bbox[1] - size // 16
    draw.text((tx, ty), "T", fill=letter_color, font=font)

    # Connection dot bottom-right
    dot_r = max(3, size // 10)
    dot_x = size - dot_r - size // 12
    dot_y = size - dot_r - size // 12
    dot_color = (34, 197, 94, 255) if connected else (85, 85, 122, 255)
    draw.ellipse(
        [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
        fill=dot_color,
    )

    return img


def make_icon_file(path: str, size: int = 512) -> str:
    """Write a PNG icon to disk, return the path."""
    img = make_icon(size, connected=True)
    img.save(path, "PNG")
    return path


def _rounded_rect(draw, x0, y0, x1, y1, r, fill):
    draw.rounded_rectangle([x0, y0, x1 - 1, y1 - 1], radius=r, fill=fill)


def _rounded_rect_outline(draw, x0, y0, x1, y1, r, outline, width=1):
    draw.rounded_rectangle([x0, y0, x1 - 1, y1 - 1], radius=r, outline=outline, width=width)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "icon.png")
    make_icon_file(out, 512)
    print(f"Icon written to {out}")
