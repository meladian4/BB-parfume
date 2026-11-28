#!/usr/bin/env python3
"""
BB Parfum Premium - Period-over-Period (MoM) Growth Evaluation PDF Generator
Compact A4 portrait layout with consolidated summary cards at top and branch comparison table.
"""

import sys
import json
from datetime import datetime, timedelta, timezone
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

WIB = timezone(timedelta(hours=7))


def format_idr(num):
    try:
        val = int(round(float(num)))
        if val < 0:
            return f"-Rp {abs(val):,.0f}".replace(",", ".")
        return f"Rp {val:,.0f}".replace(",", ".")
    except Exception:
        return f"Rp {num}"


def format_signed_idr(num):
    try:
        val = int(round(float(num)))
        if val > 0:
            return f"+Rp {val:,.0f}".replace(",", ".")
        if val < 0:
            return f"-Rp {abs(val):,.0f}".replace(",", ".")
        return "Rp 0"
    except Exception:
        return f"Rp {num}"


def format_badge_html(metric):
    pct = float(metric.get("pct", 0) or 0)
    status = str(metric.get("status") or "STABIL")
    if status == "TUMBUH" or pct > 0:
        return f"<font color='#047857'><b>TUMBUH +{pct:.1f}%</b></font>"
    if status == "MINUS" or pct < 0:
        return f"<font color='#B91C1C'><b>MINUS {pct:.1f}%</b></font>"
    return "<font color='#475569'><b>STABIL 0.0%</b></font>"


def build_pdf(data, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.3 * cm,
        rightMargin=1.3 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
        title="Evaluasi Pertumbuhan Penjualan BB Parfum",
        author="BB Parfum Premium",
    )

    styles = getSampleStyleSheet()
    c_navy = colors.HexColor("#0F172A")
    c_gold_line = colors.HexColor("#D4AF37")
    c_slate = colors.HexColor("#334155")
    c_light = colors.HexColor("#F8FAFC")
    c_zebra = colors.HexColor("#F1F5F9")
    c_border = colors.HexColor("#CBD5E1")

    style_title = ParagraphStyle(
        "TitleDoc",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=c_navy,
    )
    style_cell = ParagraphStyle(
        "Cell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.8,
        leading=10.5,
        textColor=c_slate,
    )
    style_cell_right = ParagraphStyle("CellR", parent=style_cell, alignment=2)
    style_cell_center = ParagraphStyle("CellC", parent=style_cell, alignment=1)
    style_th = ParagraphStyle(
        "Th",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=10,
        textColor=colors.white,
    )
    style_th_right = ParagraphStyle("ThR", parent=style_th, alignment=2)
    style_th_center = ParagraphStyle("ThC", parent=style_th, alignment=1)
    style_sec = ParagraphStyle(
        "Sec",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=c_navy,
    )

    story = []
    usable_w = 18.4 * cm
    now_wib = datetime.now(WIB).strftime("%d/%m/%Y %H:%M")

    preset_title = escape(str(data.get("preset_title") or "Evaluasi Pertumbuhan Penjualan (MoM)"))
    primary_label = escape(str(data.get("primary_label") or "-"))
    compare_label = escape(str(data.get("compare_label") or "-"))

    # 1. HEADER COMPACT
    t_header = Table(
        [
            [
                Paragraph(
                    "<b>BB PARFUM PREMIUM</b><br/>"
                    f"<font color='#B48811' size='8'>{preset_title.upper()}</font>",
                    style_title,
                ),
                Paragraph(
                    "<b>LAPORAN EVALUASI OWNER</b><br/>"
                    f"<font size='7.2' color='#475569'>Dicetak: {now_wib} WIB</font>",
                    style_cell_right,
                ),
            ]
        ],
        colWidths=[11.4 * cm, 7.0 * cm],
    )
    t_header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1.4, color=c_gold_line, spaceAfter=7, spaceBefore=2))

    # Period Banner
    t_period = Table(
        [
            [
                Paragraph(f"<b>Periode Utama:</b> <font color='#0F172A'>{primary_label}</font>", style_cell),
                Paragraph(f"<b>Periode Pembanding:</b> <font color='#475569'>{compare_label}</font>", style_cell),
            ]
        ],
        colWidths=[usable_w / 2, usable_w / 2],
    )
    t_period.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), c_light),
                ("BOX", (0, 0), (-1, -1), 0.5, c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(t_period)
    story.append(Spacer(1, 8))

    # 2. DUA KARTU RINGKASAN KONSOLIDASI DI BAGIAN ATAS
    totals = data.get("totals") or {}
    t_trx = totals.get("transactions") or {}
    t_sales = totals.get("net_sales") or {}
    t_net = totals.get("net_profit") or {}
    t_central = totals.get("central_expenses") or {}

    trx_diff = int(t_trx.get("diff", 0) or 0)
    trx_diff_str = f"+{trx_diff}" if trx_diff > 0 else str(trx_diff)

    cards = [
        [
            Paragraph(
                "<font size='7.2' color='#475569'><b>TOTAL TRANSAKSI KONSOLIDASI</b></font><br/>"
                f"<b><font size='12' color='#0F172A'>{int(t_trx.get('primary', 0))} Trx</font></b>"
                f"&nbsp;&nbsp;{format_badge_html(t_trx)}<br/>"
                f"<font size='7.2' color='#475569'>Pembanding: {int(t_trx.get('compare', 0))} Trx (Selisih: {trx_diff_str} Trx)</font>",
                style_cell,
            ),
            Paragraph(
                "<font size='7.2' color='#475569'><b>TOTAL OMZET &amp; LABA BERSIH CABANG</b></font><br/>"
                f"<b><font size='12' color='#0F172A'>{format_idr(t_sales.get('primary', 0))}</font></b>"
                f"&nbsp;&nbsp;{format_badge_html(t_net)}<br/>"
                f"<font size='7.2' color='#475569'>Laba Bersih: <b>{format_idr(t_net.get('primary', 0))}</b> vs {format_idr(t_net.get('compare', 0))} ({format_signed_idr(t_net.get('diff', 0))})</font>",
                style_cell,
            ),
        ]
    ]
    t_cards = Table(cards, colWidths=[usable_w / 2, usable_w / 2])
    t_cards.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.9, c_gold_line),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(t_cards)
    story.append(Spacer(1, 10))

    # 3. TABEL RINCIAN PER CABANG
    story.append(Paragraph("<b>Rincian Pertumbuhan Per Cabang &amp; Konsolidasi</b>", style_sec))
    story.append(Spacer(1, 4))

    rows = [
        [
            Paragraph("Cabang / Outlet", style_th),
            Paragraph("Transaksi<br/>(Utama vs Bnd)", style_th_center),
            Paragraph("Omzet Utama<br/>(vs Pembanding)", style_th_right),
            Paragraph("Laba Bersih<br/>(vs Pembanding)", style_th_right),
            Paragraph("Selisih Laba<br/>(Rp)", style_th_right),
            Paragraph("Status", style_th_center),
        ]
    ]

    branches = data.get("branches") or []
    for b in branches:
        b_name = escape(str(b.get("store_name") or "-"))
        b_code = escape(str(b.get("store_code") or ""))
        trx = b.get("transactions") or {}
        sal = b.get("net_sales") or {}
        prof = b.get("net_profit") or {}
        exp = b.get("expenses") or {}
        b_trx_diff = int(trx.get("diff", 0) or 0)
        b_trx_diff_str = f"+{b_trx_diff}" if b_trx_diff > 0 else str(b_trx_diff)

        rows.append(
            [
                Paragraph(
                    f"<b>{b_name}</b><br/><font size='6.8' color='#64748B'>{b_code} • OPEX: {format_idr(exp.get('primary', 0))}</font>",
                    style_cell,
                ),
                Paragraph(
                    f"<b>{int(trx.get('primary', 0))}</b> vs {int(trx.get('compare', 0))}<br/>"
                    f"<font size='6.8' color='#475569'>({b_trx_diff_str} Trx)</font>",
                    style_cell_center,
                ),
                Paragraph(
                    f"<b>{format_idr(sal.get('primary', 0))}</b><br/>"
                    f"<font size='6.8' color='#64748B'>vs {format_idr(sal.get('compare', 0))}</font>",
                    style_cell_right,
                ),
                Paragraph(
                    f"<b>{format_idr(prof.get('primary', 0))}</b><br/>"
                    f"<font size='6.8' color='#64748B'>vs {format_idr(prof.get('compare', 0))}</font>",
                    style_cell_right,
                ),
                Paragraph(
                    f"<b>{format_signed_idr(prof.get('diff', 0))}</b>",
                    style_cell_right,
                ),
                Paragraph(format_badge_html(prof), style_cell_center),
            ]
        )

    # Baris Total Konsolidasi
    rows.append(
        [
            Paragraph("<b>TOTAL KONSOLIDASI</b>", style_cell),
            Paragraph(
                f"<b>{int(t_trx.get('primary', 0))}</b> vs {int(t_trx.get('compare', 0))}",
                style_cell_center,
            ),
            Paragraph(
                f"<b>{format_idr(t_sales.get('primary', 0))}</b><br/>"
                f"<font size='6.8' color='#475569'>vs {format_idr(t_sales.get('compare', 0))}</font>",
                style_cell_right,
            ),
            Paragraph(
                f"<b>{format_idr(t_net.get('primary', 0))}</b><br/>"
                f"<font size='6.8' color='#475569'>vs {format_idr(t_net.get('compare', 0))}</font>",
                style_cell_right,
            ),
            Paragraph(f"<b>{format_signed_idr(t_net.get('diff', 0))}</b>", style_cell_right),
            Paragraph(format_badge_html(t_net), style_cell_center),
        ]
    )

    t_table = Table(
        rows,
        colWidths=[4.2 * cm, 2.5 * cm, 3.3 * cm, 3.3 * cm, 2.5 * cm, 2.6 * cm],
        repeatRows=1,
    )
    tbl_style = [
        ("BACKGROUND", (0, 0), (-1, 0), c_navy),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 5),
        ("TOPPADDING", (0, 1), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
        ("GRID", (0, 0), (-1, -1), 0.4, c_border),
        ("BACKGROUND", (0, -1), (-1, -1), c_zebra),
    ]
    for idx in range(1, len(rows) - 1):
        if idx % 2 == 0:
            tbl_style.append(("BACKGROUND", (0, idx), (-1, idx), c_light))
    t_table.setStyle(TableStyle(tbl_style))
    story.append(t_table)

    central_p = float(t_central.get("primary", 0) or 0)
    central_c = float(t_central.get("compare", 0) or 0)
    if central_p > 0 or central_c > 0:
        story.append(Spacer(1, 6))
        story.append(
            Paragraph(
                f"<font size='7.2' color='#475569'><b>Catatan OPEX Pusat (Super Admin):</b> "
                f"Periode Utama {format_idr(central_p)} vs Pembanding {format_idr(central_c)} "
                f"(tidak dibebankan ke masing-masing cabang).</font>",
                style_cell,
            )
        )

    doc.build(story)


if __name__ == "__main__":
    if len(sys.argv) > 2:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            payload = json.load(f)
        build_pdf(payload, sys.argv[2])
    else:
        payload = json.loads(sys.stdin.read())
        out_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/evaluasi_report.pdf"
        build_pdf(payload, out_file)
        print(out_file)
