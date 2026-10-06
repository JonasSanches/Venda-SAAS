#!/usr/bin/env python3
"""Create a readable, machine-translated beta PDF from the supplied Portuguese edition."""

from html import escape
from pathlib import Path

import argostranslate.translate
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


SOURCE = Path("/Users/arianesanches/Downloads/O Apocalipse de Jonas v1.1.pdf")
DESTINATION = Path("output/pdf/the-apocalypse-of-jonah-en-beta.pdf")


def translate(text: str) -> str:
    # Argos is more reliable with page-sized passages than one huge document.
    return argostranslate.translate.translate(text, "pt", "en")


def footer(canvas, document):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#c4932b"))
    canvas.line(2 * cm, 1.65 * cm, A4[0] - 2 * cm, 1.65 * cm)
    canvas.setFillColor(colors.HexColor("#526176"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1.15 * cm, "The Apocalypse of Jonah - English beta edition")
    canvas.drawRightString(A4[0] - 2 * cm, 1.15 * cm, str(document.page))
    canvas.restoreState()


def main():
    reader = PdfReader(SOURCE)
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("bookTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=29, textColor=colors.HexColor("#102039"), alignment=TA_CENTER, spaceAfter=18)
    subtitle = ParagraphStyle("bookSubtitle", parent=styles["Normal"], fontName="Helvetica", fontSize=11, leading=16, textColor=colors.HexColor("#526176"), alignment=TA_CENTER)
    body = ParagraphStyle("bookBody", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=colors.HexColor("#172033"), spaceAfter=8)
    document = SimpleDocTemplate(str(DESTINATION), pagesize=A4, leftMargin=2.1 * cm, rightMargin=2.1 * cm, topMargin=2.2 * cm, bottomMargin=2.3 * cm, title="The Apocalypse of Jonah")
    story = [Spacer(1, 5.5 * cm), Paragraph("THE APOCALYPSE OF JONAH", title), Paragraph("English beta edition - machine translated from the Portuguese original. Editorial review pending.", subtitle), PageBreak()]
    for number, page in enumerate(reader.pages, start=1):
        source = (page.extract_text() or "").strip()
        if source:
            translated = translate(source)
            for paragraph in translated.split("\n"):
                paragraph = paragraph.strip()
                if paragraph:
                    story.append(Paragraph(escape(paragraph), body))
        else:
            story.append(Paragraph("[No extractable text was found on this source page.]", body))
        if number < len(reader.pages):
            story.append(PageBreak())
        if number % 10 == 0 or number == len(reader.pages):
            print(f"translated {number}/{len(reader.pages)} pages", flush=True)
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    print(DESTINATION)


if __name__ == "__main__":
    main()
