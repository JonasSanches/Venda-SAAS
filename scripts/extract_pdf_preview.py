#!/usr/bin/env python3
"""Extract a low-resolution promotional page from a PDF."""

import sys
from pathlib import Path

import fitz


source, destination = Path(sys.argv[1]), Path(sys.argv[2])
document = fitz.open(source)
candidates = range(1, min(document.page_count, 31))


def score(index: int) -> int:
    page = document[index]
    text_length = len(page.get_text("text").strip())
    images = len(page.get_images(full=True))
    return min(text_length, 1400) + images * 220


selected = max(candidates, key=score, default=0)
page = document[selected]
scale = min(1.15, 720 / max(1, page.rect.width))
pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
destination.parent.mkdir(parents=True, exist_ok=True)
pixmap.save(destination, jpg_quality=72)
print(f"{source.name}: página {selected + 1}/{document.page_count}")
