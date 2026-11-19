from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.schemas import ScanResult


def create_pdf_report(result: ScanResult, annotated_path: str) -> bytes:
    output = BytesIO()
    document = SimpleDocTemplate(output, pagesize=letter, title="DentalSurface AI scan report")
    styles = getSampleStyleSheet()
    story = [
        Paragraph("DentalSurface AI — Preliminary Scan Report", styles["Title"]),
        Paragraph(f"Scan {result.scan_id} · {result.created_at:%Y-%m-%d %H:%M UTC} · {result.xray_type.title()}", styles["Normal"]),
        Spacer(1, 12),
    ]
    try:
        preview = Image(annotated_path, width=480, height=300, kind="proportional")
        story.extend([preview, Spacer(1, 12)])
    except (OSError, ValueError):
        pass
    rows = [["FDI", "Tooth", "Confidence", "Findings"]]
    for tooth in result.teeth:
        findings = ", ".join(f"{finding.type.replace('_', ' ')} ({finding.surface})" for finding in tooth.findings) or "No flagged finding"
        rows.append([str(tooth.fdi), tooth.tooth_name, f"{tooth.confidence:.0%}", findings])
    table = Table(rows, repeatRows=1, colWidths=[45, 130, 75, 280])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0e7490")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#ccd5df")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f2f7fa")]),
    ]))
    story.extend([table, Spacer(1, 14), Paragraph(result.disclaimer, styles["Italic"])])
    document.build(story)
    return output.getvalue()
