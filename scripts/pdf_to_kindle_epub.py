#!/usr/bin/env python3
"""Convert a PDF to a fixed-layout EPUB suitable for Send to Kindle."""

import html
import subprocess
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path

import fitz


def convert(source: Path, destination: Path, title: str) -> None:
    document = fitz.open(source)
    identifier = str(uuid.uuid4())
    destination.parent.mkdir(parents=True, exist_ok=True)
    manifest = []
    spine = []
    navigation = []
    with zipfile.ZipFile(destination, "w") as archive:
        archive.writestr("mimetype", "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        archive.writestr("META-INF/container.xml", """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>""")
        for number, page in enumerate(document, start=1):
            rectangle = page.rect
            scale = min(1.05, 760 / max(1, rectangle.width))
            image_name = f"images/page-{number:04d}.jpg"
            page_name = f"page-{number:04d}.xhtml"
            if source.name.startswith("42f184a0e8d34af-") and number >= 91:
                with tempfile.TemporaryDirectory() as temporary:
                    single = fitz.open()
                    single.insert_pdf(document, from_page=number - 1, to_page=number - 1)
                    pdf_page, jpg_page = Path(temporary) / "page.pdf", Path(temporary) / "page.jpg"
                    single.save(pdf_page); single.close()
                    subprocess.run(["sips", "-s", "format", "jpeg", str(pdf_page), "--out", str(jpg_page)], check=True, capture_output=True)
                    image_data = jpg_page.read_bytes()
                    width, height = 760, round(760 * rectangle.height / rectangle.width)
            else:
                pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
                width, height = pixmap.width, pixmap.height
                image_data = pixmap.tobytes("jpeg", jpg_quality=66)
            archive.writestr(f"OEBPS/{image_name}", image_data)
            if number % 10 == 0 or number == document.page_count:
                print(f"{number}/{document.page_count}", flush=True)
            archive.writestr(f"OEBPS/{page_name}", f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>{html.escape(title)} — página {number}</title><meta name="viewport" content="width={width},height={height}"/><style>html,body{{margin:0;padding:0;width:100%;height:100%;background:white}}img{{display:block;width:100%;height:100%;object-fit:contain}}</style></head><body><img src="{image_name}" alt="Página {number}"/></body></html>""")
            manifest.extend([f'<item id="page{number}" href="{page_name}" media-type="application/xhtml+xml"/>', f'<item id="image{number}" href="{image_name}" media-type="image/jpeg"/>'])
            spine.append(f'<itemref idref="page{number}"/>')
            navigation.append(f'<li><a href="{page_name}">Página {number}</a></li>')
        archive.writestr("OEBPS/nav.xhtml", f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Sumário</title></head><body><nav epub:type="toc"><h1>{html.escape(title)}</h1><ol>{''.join(navigation)}</ol></nav></body></html>""")
        archive.writestr("OEBPS/content.opf", f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" prefix="rendition: http://www.idpf.org/vocab/rendition/#"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:{identifier}</dc:identifier><dc:title>{html.escape(title)}</dc:title><dc:language>pt-BR</dc:language><meta property="dcterms:modified">2026-09-08T00:00:00Z</meta><meta property="rendition:layout">pre-paginated</meta><meta property="rendition:orientation">auto</meta><meta property="rendition:spread">none</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>{''.join(manifest)}</manifest><spine>{''.join(spine)}</spine></package>""")
    document.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("uso: pdf_to_kindle_epub.py origem.pdf destino.epub 'Título'")
    convert(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3])
