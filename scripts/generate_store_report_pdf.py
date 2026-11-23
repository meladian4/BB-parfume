#!/usr/bin/env python3
"""
BB Parfum Premium - Official Store Transaction & Category Report PDF Generator
Generates an executive vector A4 PDF report for a retail store branch.
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
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

WIB = timezone(timedelta(hours=7))


def format_idr(num):
    try:
        val = int(round(float(num)))
        return f"Rp {val:,.0f}".replace(",", ".")
    except Exception:
        return f"Rp {num}"


def format_wib(iso_str):
    if not iso_str:
        return "-"
    try:
        dt = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        dt_wib = dt.astimezone(WIB)
        return dt_wib.strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(iso_str)[:16].replace("T", " ")


def build_pdf(data, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.4 * cm,
        rightMargin=1.4 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.4 * cm,
        title=f"Laporan Transaksi {data.get('store_name', 'Cabang')}",
        author="BB Parfum Premium",
    )

    styles = getSampleStyleSheet()

    # Palette (high-contrast print & mobile screen readable)
    c_navy = colors.HexColor("#0F172A")
    c_gold = colors.HexColor("#B48811")
    c_gold_line = colors.HexColor("#D4AF37")
    c_slate = colors.HexColor("#334155")
    c_muted = colors.HexColor("#475569")
    c_light = colors.HexColor("#F8FAFC")
    c_zebra = colors.HexColor("#F1F5F9")
    c_border = colors.HexColor("#CBD5E1")
    c_emerald = colors.HexColor("#047857")
    c_blue = colors.HexColor("#0369A1")

    style_title = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=c_navy,
    )
    style_section = ParagraphStyle(
        "SecHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=c_navy,
    )
    style_th = ParagraphStyle(
        "ThLeft",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=colors.white,
    )
    style_th_center = ParagraphStyle(
        "ThCenter",
        parent=style_th,
        alignment=1,
    )
    style_th_right = ParagraphStyle(
        "ThRight",
        parent=style_th,
        alignment=2,
    )
    style_cell = ParagraphStyle(
        "CellText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=c_slate,
    )
    style_cell_bold = ParagraphStyle(
        "CellBold",
        parent=style_cell,
        fontName="Helvetica-Bold",
        textColor=c_navy,
    )
    style_cell_center = ParagraphStyle(
        "CellCenter",
        parent=style_cell,
        alignment=1,
    )
    style_cell_right = ParagraphStyle(
        "CellRight",
        parent=style_cell,
        alignment=2,
    )
    style_cell_right_bold = ParagraphStyle(
        "CellRightBold",
        parent=style_cell_bold,
        alignment=2,
    )

    story = []
    usable_w = 18.2 * cm  # A4 21cm - 2.8cm margins

    # 1. HEADER
    now_wib = datetime.now(WIB).strftime("%d/%m/%Y %H:%M")
    header_data = [
        [
            Paragraph(
                "<b>BB PARFUM PREMIUM</b><br/>"
                "<font color='#B48811' size='8'>LAPORAN OPERASIONAL &amp; TRANSAKSI CABANG</font>",
                style_title,
            ),
            Paragraph(
                "<b>OUTPUT REPORT PDF TOKO</b><br/>"
                f"<font size='7.5' color='#475569'>Dicetak: {now_wib} WIB</font>",
                style_cell_right,
            ),
        ]
    ]
    t_header = Table(header_data, colWidths=[11.2 * cm, 7.0 * cm])
    t_header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(t_header)
    story.append(
        HRFlowable(width="100%", thickness=1.5, color=c_gold_line, spaceAfter=10, spaceBefore=3)
    )

    # 2. STORE INFO BOX
    store_name = escape(str(data.get("store_name") or "Toko Cabang"))
    store_code = escape(str(data.get("store_code") or "-"))
    store_addr = escape(str(data.get("store_address") or "-"))
    store_phone = escape(str(data.get("store_phone") or "-"))
    period_label = escape(str(data.get("period_label") or "Semua Riwayat Transaksi"))

    info_data = [
        [
            Paragraph(f"<b>Nama Cabang:</b> {store_name}", style_cell),
            Paragraph(f"<b>Kode Toko:</b> {store_code}", style_cell),
        ],
        [
            Paragraph(f"<b>Alamat:</b> {store_addr}", style_cell),
            Paragraph(f"<b>Kontak / Telp:</b> {store_phone}", style_cell),
        ],
        [
            Paragraph(f"<b>Periode Laporan:</b> <font color='#0369A1'><b>{period_label}</b></font>", style_cell),
            Paragraph("<b>Status Cabang:</b> <font color='#047857'><b>Aktif Beroperasi</b></font>", style_cell),
        ],
    ]
    t_info = Table(info_data, colWidths=[11.4 * cm, 6.8 * cm])
    t_info.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), c_light),
                ("BOX", (0, 0), (-1, -1), 0.6, c_border),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(t_info)
    story.append(Spacer(1, 10))

    # 3. METRIC CARDS (2x2 Grid so large figures breathe cleanly & stay legible on phone PDF viewers)
    tot_sales = data.get("total_net_sales", 0)
    tot_trx = data.get("total_transactions", 0)
    cash_info = data.get("cash_summary", {})
    cash_amt = cash_info.get("amount", 0)
    cash_cnt = cash_info.get("count", 0)
    qris_info = data.get("qris_summary", {})
    qris_amt = qris_info.get("amount", 0)
    qris_cnt = qris_info.get("count", 0)
    avail_cash = data.get("available_cash", 0)

    cards_data = [
        [
            Paragraph(
                f"<font size='7.5' color='#475569'><b>TOTAL OMSET PENJUALAN</b></font><br/>"
                f"<b><font size='12' color='#0F172A'>{format_idr(tot_sales)}</font></b><br/>"
                f"<font size='7.5' color='#0369A1'>{tot_trx} Transaksi Sah</font>",
                style_cell,
            ),
            Paragraph(
                f"<font size='7.5' color='#475569'><b>TRANSAKSI CASH (TUNAI)</b></font><br/>"
                f"<b><font size='12' color='#047857'>{format_idr(cash_amt)}</font></b><br/>"
                f"<font size='7.5' color='#475569'>{cash_cnt} Transaksi Tunai</font>",
                style_cell,
            ),
        ],
        [
            Paragraph(
                f"<font size='7.5' color='#475569'><b>TRANSAKSI QRIS (NON-TUNAI)</b></font><br/>"
                f"<b><font size='12' color='#0369A1'>{format_idr(qris_amt)}</font></b><br/>"
                f"<font size='7.5' color='#475569'>{qris_cnt} Transaksi Digital</font>",
                style_cell,
            ),
            Paragraph(
                f"<font size='7.5' color='#475569'><b>CASH FISIK DI LACI TOKO</b></font><br/>"
                f"<b><font size='12' color='#B48811'>{format_idr(avail_cash)}</font></b><br/>"
                f"<font size='7.5' color='#475569'>Saldo Aktual Belum Disetor ke Pusat</font>",
                style_cell,
            ),
        ],
    ]
    t_cards = Table(cards_data, colWidths=[usable_w / 2, usable_w / 2])
    t_cards.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.9, c_gold_line),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, c_border),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.append(t_cards)
    story.append(Spacer(1, 12))

    # 4. RANGKUMAN KATEGORI PRODUK TERJUAL
    story.append(Paragraph("<b>1. Rangkuman Kategori Produk Terjual</b>", style_section))
    story.append(Spacer(1, 5))

    cat_rows = [
        [
            Paragraph("Kategori Produk", style_th),
            Paragraph("Satuan", style_th_center),
            Paragraph("Volume / Qty", style_th_right),
            Paragraph("Frekuensi", style_th_center),
            Paragraph("Nominal Omset", style_th_right),
            Paragraph("Porsi", style_th_right),
        ]
    ]

    categories = data.get("category_summary", [])
    total_cat_amount = sum(c.get("total_amount", 0) for c in categories) or 1

    for c in categories:
        amt = c.get("total_amount", 0)
        pct = (amt / total_cat_amount) * 100 if total_cat_amount > 0 else 0
        raw_label = str(c.get("label", c.get("category", "-")))
        # Hapus emoji agar ReportLab Helvetica tidak menampilkan kotak kosong
        clean_label = "".join(ch for ch in raw_label if ord(ch) < 128).strip() or raw_label
        unit = escape(str(c.get("unit", "-")))
        qty_fmt = f"{int(round(float(c.get('total_quantity', 0)))):,}".replace(",", ".")
        cat_rows.append(
            [
                Paragraph(escape(clean_label), style_cell_bold),
                Paragraph(unit, style_cell_center),
                Paragraph(f"{qty_fmt} {unit}", style_cell_right),
                Paragraph(f"{c.get('transaction_count', 0)} trx", style_cell_center),
                Paragraph(format_idr(amt), style_cell_right_bold),
                Paragraph(f"{pct:.1f}%", style_cell_right),
            ]
        )

    cat_rows.append(
        [
            Paragraph("<b>TOTAL OMSET BERSIH CABANG</b>", style_cell_bold),
            Paragraph("-", style_cell_center),
            Paragraph("-", style_cell_right),
            Paragraph(f"<b>{tot_trx} trx</b>", style_cell_center),
            Paragraph(f"<b>{format_idr(tot_sales)}</b>", style_cell_right_bold),
            Paragraph("<b>100.0%</b>", style_cell_right_bold),
        ]
    )

    t_cat = Table(
        cat_rows,
        colWidths=[5.6 * cm, 1.8 * cm, 3.0 * cm, 2.3 * cm, 3.7 * cm, 1.8 * cm],
        repeatRows=1,
    )
    cat_style = [
        ("BACKGROUND", (0, 0), (-1, 0), c_navy),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.4, c_border),
        ("BACKGROUND", (0, -1), (-1, -1), c_zebra),
    ]
    for idx in range(1, len(cat_rows) - 1):
        if idx % 2 == 0:
            cat_style.append(("BACKGROUND", (0, idx), (-1, idx), c_light))
    t_cat.setStyle(TableStyle(cat_style))
    story.append(t_cat)
    story.append(Spacer(1, 14))

    # 5. RINCIAN TRANSAKSI PENJUALAN
    sales_list = data.get("recent_sales", [])
    story.append(
        Paragraph(
            f"<b>2. Rincian Riwayat Transaksi Toko ({len(sales_list)} Transaksi)</b>",
            style_section,
        )
    )
    story.append(Spacer(1, 5))

    sales_rows = [
        [
            Paragraph("No. Invoice", style_th),
            Paragraph("Waktu (WIB)", style_th),
            Paragraph("Kasir / Member", style_th),
            Paragraph("Metode", style_th_center),
            Paragraph("Rincian Item", style_th),
            Paragraph("Total (Rp)", style_th_right),
        ]
    ]

    if not sales_list:
        sales_rows.append(
            [
                Paragraph("Belum ada transaksi sah pada periode ini.", style_cell),
                Paragraph("-", style_cell),
                Paragraph("-", style_cell),
                Paragraph("-", style_cell_center),
                Paragraph("-", style_cell),
                Paragraph("-", style_cell_right),
            ]
        )
    else:
        for s in sales_list[:200]:
            inv = escape(str(s.get("invoice_number", "-")))
            dt = format_wib(s.get("created_at", ""))
            cashier_name = escape(str((s.get("cashier") or {}).get("full_name") or "Kasir"))
            member_name = (s.get("member") or {}).get("name")
            who_html = f"<font size='7.2'><b>{cashier_name}</b></font>"
            if member_name:
                who_html += f"<br/><font size='6.8' color='#047857'>Member: {escape(str(member_name))}</font>"

            method = "CASH"
            if s.get("payments"):
                method = str(s["payments"][0].get("payment_method", "CASH"))

            items = s.get("items", [])
            item_parts = []
            for it in items[:3]:
                prod = it.get("product") or {}
                p_name = escape(str(prod.get("name", "Item")))
                p_type = str(prod.get("product_type", "")).upper()
                unit = "ml" if p_type in ("BIBIT", "PELARUT") else (prod.get("unit_name") or "pcs")
                item_parts.append(f"{p_name} ({it.get('quantity', 1)} {escape(str(unit))})")
            item_desc = ", ".join(item_parts) if item_parts else "-"
            if len(items) > 3:
                item_desc += f" +{len(items) - 3} item"

            amt = s.get("final_amount", 0)
            method_color = "#047857" if method == "CASH" else "#0369A1"

            sales_rows.append(
                [
                    Paragraph(f"<font size='7.2' color='#0F172A'><b>{inv}</b></font>", style_cell),
                    Paragraph(f"<font size='7.2'>{dt}</font>", style_cell),
                    Paragraph(who_html, style_cell),
                    Paragraph(f"<font size='7.2' color='{method_color}'><b>{escape(method)}</b></font>", style_cell_center),
                    Paragraph(f"<font size='7.2'>{item_desc}</font>", style_cell),
                    Paragraph(f"<font size='7.5'><b>{format_idr(amt)}</b></font>", style_cell_right),
                ]
            )

    t_sales = Table(
        sales_rows,
        colWidths=[3.7 * cm, 2.5 * cm, 3.0 * cm, 1.6 * cm, 4.9 * cm, 2.5 * cm],
        repeatRows=1,
    )
    sales_style = [
        ("BACKGROUND", (0, 0), (-1, 0), c_navy),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4.5),
        ("GRID", (0, 0), (-1, -1), 0.4, c_border),
    ]
    for idx in range(1, len(sales_rows)):
        if idx % 2 == 0:
            sales_style.append(("BACKGROUND", (0, idx), (-1, idx), c_light))
    t_sales.setStyle(TableStyle(sales_style))
    story.append(t_sales)
    story.append(Spacer(1, 18))

    # 6. SIGNATURE BLOCK
    sig_data = [
        [
            Paragraph(
                "Petugas Kasir Cabang,<br/><br/><br/><br/>"
                "( ......................................... )<br/>"
                "<font size='7.5' color='#475569'>Kasir Shift Bertugas</font>",
                style_cell_center,
            ),
            Paragraph("", style_cell),
            Paragraph(
                "Mengetahui &amp; Menyetujui,<br/><br/><br/><br/>"
                "<b>( ......................................... )</b><br/>"
                "<font size='7.5' color='#475569'>Super Admin / Owner BB Parfum</font>",
                style_cell_center,
            ),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[6.6 * cm, 5.0 * cm, 6.6 * cm])
    t_sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(KeepTogether([t_sig]))

    doc.build(story)


if __name__ == "__main__":
    if len(sys.argv) > 2:
        json_file = sys.argv[1]
        out_file = sys.argv[2]
        with open(json_file, "r", encoding="utf-8") as f:
            payload = json.load(f)
        build_pdf(payload, out_file)
    else:
        payload = json.loads(sys.stdin.read())
        out_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/store_report.pdf"
        build_pdf(payload, out_file)
        print(out_file)
