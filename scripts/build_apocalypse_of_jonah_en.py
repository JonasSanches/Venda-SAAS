#!/usr/bin/env python3
"""Build a page-faithful English PDF edition of *O Apocalipse de Jonas*.

The Portuguese edition has a deliberately simple print layout: Times text on a
cream page, chapter heads, page numbers and eight full-page artworks.  This
builder preserves that structure and every source artwork, replacing only the
readable Portuguese text with its English translation.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import argostranslate.translate
import fitz


SOURCE = Path("/Users/arianesanches/Downloads/O Apocalipse de Jonas v1.1.pdf")
DESTINATION = Path("storage/digital-products/pdf/the-apocalypse-of-jonah-en-beta.pdf")
CACHE = Path("tmp/pdfs/apocalypse-of-jonah-en-translations.json")

PAPER = (0.988, 0.984, 0.965)
INK = (0.10, 0.09, 0.08)
GOLD = (0.78, 0.64, 0.31)


def load_cache() -> dict[str, str]:
    if not CACHE.exists():
        return {}
    try:
        return json.loads(CACHE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")


def translation(text: str, cache: dict[str, str]) -> str:
    clean = " ".join(text.replace("\u00ad", "").split())
    if not clean:
        return ""
    if clean not in cache:
        cache[clean] = argostranslate.translate.translate(clean, "pt", "en")
    return cache[clean]


def blocks(page: fitz.Page):
    result = []
    for item in page.get_text("dict")["blocks"]:
        if item["type"] != 0:
            continue
        spans = [span for line in item["lines"] for span in line["spans"]]
        text = "".join(span["text"] for span in spans).strip()
        if text:
            result.append((fitz.Rect(item["bbox"]), text, spans))
    return result


def is_page_number(rect: fitz.Rect, text: str, page_height: float) -> bool:
    return rect.y0 > page_height - 55 and text.strip().replace("-", "").isdigit()


def draw_textbox(page: fitz.Page, rect: fitz.Rect, text: str, *, font: str, size: float, color=INK, align=0) -> None:
    """Fit translated text in the source block while keeping it readable."""
    for candidate in (size, size - 0.35, size - 0.7, size - 1.05, size - 1.4, size - 1.75, 7.0, 6.6):
        if candidate < 6.5:
            continue
        remainder = page.insert_textbox(rect, text, fontname=font, fontsize=candidate, color=color, align=align, lineheight=1.28)
        if remainder >= 0:
            return
    # Very rare long translations: use the smallest practical type instead of
    # overflowing over an illustration or the page number.
    page.insert_textbox(rect, text, fontname=font, fontsize=6.3, color=color, align=align, lineheight=1.18)


def draw_regular_page(target: fitz.Page, source: fitz.Page, cache: dict[str, str]) -> None:
    width, height = source.rect.width, source.rect.height
    target.draw_rect(target.rect, color=PAPER, fill=PAPER, overlay=False)
    source_blocks = blocks(source)
    heading_blocks = []
    body_blocks = []
    number_blocks = []
    for rect, text, spans in source_blocks:
        if is_page_number(rect, text, height):
            number_blocks.append((rect, text))
            continue
        largest = max(span["size"] for span in spans)
        font_names = " ".join(span["font"] for span in spans).lower()
        if largest >= 14 or (rect.y0 < 125 and ("italic" in font_names or "bold" in font_names) and len(text) < 180):
            heading_blocks.append((rect, text, spans))
        else:
            body_blocks.append((rect, text, spans))

    for rect, text, spans in heading_blocks:
        largest = max(span["size"] for span in spans)
        italic = any("italic" in span["font"].lower() for span in spans)
        bold = any("bold" in span["font"].lower() for span in spans)
        expanded = fitz.Rect(42, rect.y0 - 1, width - 42, max(rect.y1 + 12, rect.y0 + largest * 2.2))
        draw_textbox(target, expanded, translation(text, cache), font="tibi" if bold else ("tiit" if italic else "tiro"), size=largest, align=1)

    if body_blocks:
        body_blocks.sort(key=lambda item: (item[0].y0, item[0].x0))
        parts: list[str] = []
        previous_y = body_blocks[0][0].y0
        for rect, text, _ in body_blocks:
            if rect.y0 - previous_y > 22:
                parts.append("\n\n")
            elif parts:
                parts.append(" ")
            parts.append(text)
            previous_y = rect.y0
        body_text = translation("".join(parts), cache)
        first_y = min(item[0].y0 for item in body_blocks)
        # Original body occupies a 305pt column.  We retain its margins and
        # reserve the printed page number at the bottom.
        body_rect = fitz.Rect(57, first_y, width - 57, height - 44)
        sample_sizes = [span["size"] for _, _, spans in body_blocks for span in spans]
        draw_textbox(target, body_rect, body_text, font="tiro", size=max(8.8, min(10.4, sum(sample_sizes) / len(sample_sizes))))

    for rect, text in number_blocks:
        target.insert_text((width / 2 - 4, rect.y1 - 1), text, fontname="tiro", fontsize=7.5, color=INK)


def draw_cover(target: fitz.Page, source_pdf: fitz.Document) -> None:
    target.show_pdf_page(target.rect, source_pdf, 0)
    # The title sits on a dark area of the supplied artwork; a subtle veil
    # covers only the Portuguese lettering before drawing its English title.
    target.draw_rect(fitz.Rect(62, 444, 358, 490), color=None, fill=(0.025, 0.035, 0.05), fill_opacity=0.94)
    draw_textbox(target, fitz.Rect(52, 452, 368, 482), "THE APOCALYPSE OF JONAH", font="tibi", size=19, color=GOLD, align=1)


def draw_art_page(target: fitz.Page, source_pdf: fitz.Document, index: int, cache: dict[str, str]) -> None:
    target.show_pdf_page(target.rect, source_pdf, index)
    # The last dedication page has text intentionally printed over its artwork.
    if index != len(source_pdf) - 1:
        return
    target.draw_rect(fitz.Rect(64, 169, 355, 370), color=None, fill=(0.02, 0.016, 0.01), fill_opacity=0.66)
    target.insert_textbox(fitz.Rect(72, 178, 347, 206), "DEDICATION", fontname="tibi", fontsize=10, color=GOLD, align=1)
    dedication = "I dedicate these words to my God, powerful and the sole holder of all honor, glory and power yesterday, today and forever. To my family, who despite all the obstacles in life have always been by my side. To no one else, only to the first divine messenger who appears and reappears in the consciousness of people who love each other. But love is the mixture of divine joy and longing in which people always need each other. God is father and mother, He who knows our difficulties; we are imperfect creatures by design, and that is the proof of the eternal love of our creator."
    draw_textbox(target, fitz.Rect(82, 230, 338, 352), dedication, font="tiro", size=8.6, color=(0.95, 0.92, 0.82), align=0)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    cache = load_cache()
    source = fitz.open(SOURCE)
    destination = fitz.open()
    for index, source_page in enumerate(source):
        out = destination.new_page(width=source_page.rect.width, height=source_page.rect.height)
        if index == 0:
            draw_cover(out, source)
        elif source_page.get_images(full=True):
            draw_art_page(out, source, index, cache)
        else:
            draw_regular_page(out, source_page, cache)
        if (index + 1) % 5 == 0:
            save_cache(cache)
        print(f"built {index + 1}/{len(source)}", flush=True)
    save_cache(cache)
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    destination.set_metadata({"title": "The Apocalypse of Jonah", "author": "Jonas Sanches", "subject": "English edition", "keywords": "Jonah, apocalypse, spirituality"})
    destination.save(DESTINATION, garbage=4, deflate=True)
    destination.close()
    source.close()
    print(DESTINATION)


if __name__ == "__main__":
    main()
