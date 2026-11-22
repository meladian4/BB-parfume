#!/usr/bin/env python3
"""
BB Parfum Premium - Official Store Transaction & Category Report PDF Generator
Generates an executive vector PDF report for a retail store branch.
"""

import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm

def format_idr(num):
    try:
        val = int(round(float(num)))
        return f"Rp {val:,.0f}".replace(",", ".")
    except:
        return f"Rp {num}"

def build_pdf(data, output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm
    )

    styles = getSampleStyleSheet()

    # Colors
    c_primary = colors.HexColor("#0F172A")    # Deep Navy
    c_gold = colors.HexColor("#D4AF37")       # Gold Accent
    c_slate = colors.HexColor("#334155")      # Dark Slate
    c_muted = colors.HexColor("#64748B")      # Muted Slate
    c_light = colors.HexColor("#F8FAFC")      # Light BG
    c_border = colors.HexColor("#E2E8F0")     # Light Border
    c_emerald = colors.HexColor("#059669")    # Emerald Green
    c_blue = colors.HexColor("#0284C7")       # Blue

    # Custom Styles
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
    )
    style_subtitle = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=c_muted,
    )
    style_section = ParagraphStyle(
        'SecHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=c_primary,
    )
    style_cell = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_slate,
    )
    style_cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary,
    )
    style_cell_center = ParagraphStyle(
        'CellCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=1,
        textColor=c_slate,
    )
    style_cell_right = ParagraphStyle(
        'CellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        alignment=2,
        textColor=c_slate,
    )
    style_cell_right_bold = ParagraphStyle(
        'CellRightBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        alignment=2,
        textColor=c_primary,
    )

    story = []

    # 1. HEADER
    header_data = [
        [
            Paragraph("<b>BB PARFUM PREMIUM</b><br/><font color='#D4AF37' size='8'>SISTEM OPERASIONAL RETAIL & KENDALI CABANG</font>", style_title),
            Paragraph("<b>LAPORAN TRANSAKSI CABANG</b><br/><font size='7' color='#64748B'>Dicetak: " + datetime.now().strftime("%d/%m/%Y %H:%M") + " WIB</font>", style_cell_right)
        ]
    ]
    t_header = Table(header_data, colWidths=[10.5 * cm, 7.5 * cm])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_header)
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_gold, spaceAfter=10, spaceBefore=4))

    # 2. STORE INFO BOX
    store_name = data.get("store_name", "Toko Cabang")
    store_code = data.get("store_code", "-")
    store_addr = data.get("store_address", "-")
    store_phone = data.get("store_phone", "-")
    period_label = data.get("period_label", "Semua Riwayat Transaksi")

    info_data = [
        [
            Paragraph(f"<b>Nama Cabang:</b> {store_name}", style_cell),
            Paragraph(f"<b>Kode Toko:</b> {store_code}", style_cell),
        ],
        [
            Paragraph(f"<b>Alamat:</b> {store_addr}", style_cell),
            Paragraph(f"<b>Kontak/Telp:</b> {store_phone}", style_cell),
        ],
        [
            Paragraph(f"<b>Periode Data:</b> <font color='#0284C7'><b>{period_label}</b></font>", style_cell),
            Paragraph(f"<b>Status Kasir:</b> <font color='#059669'><b>Aktif Terkunci</b></font>", style_cell),
        ]
    ]
    t_info = Table(info_data, colWidths=[11 * cm, 7 * cm])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 10))

    # 3. METRIC CARDS (TOTAL OMSET, CASH, QRIS, CASH FISIK LACI)
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
            Paragraph(f"<font size='7' color='#64748B'>TOTAL OMSET PENJUALAN</font><br/><b><font size='10' color='#0F172A'>{format_idr(tot_sales)}</font></b><br/><font size='7' color='#0284C7'>{tot_trx} Transaksi</font>", style_cell),
            Paragraph(f"<font size='7' color='#64748B'>PEMBAYARAN CASH (TUNAI)</font><br/><b><font size='10' color='#059669'>{format_idr(cash_amt)}</font></b><br/><font size='7' color='#64748B'>{cash_cnt} Transaksi Cash</font>", style_cell),
            Paragraph(f"<font size='7' color='#64748B'>PEMBAYARAN QRIS</font><br/><b><font size='10' color='#0284C7'>{format_idr(qris_amt)}</font></b><br/><font size='7' color='#64748B'>{qris_cnt} Transaksi QRIS</font>", style_cell),
            Paragraph(f"<font size='7' color='#64748B'>SISA CASH FISIK DI TOKO</font><br/><b><font size='10' color='#D4AF37'>{format_idr(avail_cash)}</font></b><br/><font size='7' color='#64748B'>Belum Disetor ke Pusat</font>", style_cell),
        ]
    ]
    t_cards = Table(cards_data, colWidths=[4.5 * cm, 4.5 * cm, 4.5 * cm, 4.5 * cm])
    t_cards.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
        ('BOX', (0, 0), (-1, -1), 0.8, c_gold),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_cards)
    story.append(Spacer(1, 12))

    # 4. RANGKUMAN KATEGORI PRODUK TERJUAL
    story.append(Paragraph("<b>1. Rangkuman Kategori Produk Terjual</b>", style_section))
    story.append(Spacer(1, 4))

    cat_headers = [
        Paragraph("<b>Kategori Produk</b>", style_cell_bold),
        Paragraph("<b>Satuan</b>", style_cell_center),
        Paragraph("<b>Total Volume / Qty</b>", style_cell_right_bold),
        Paragraph("<b>Frekuensi Trx</b>", style_cell_center),
        Paragraph("<b>Total Omset (Rp)</b>", style_cell_right_bold),
        Paragraph("<b>Kontribusi</b>", style_cell_right),
    ]
    cat_rows = [cat_headers]

    categories = data.get("category_summary", [])
    total_cat_amount = sum(c.get("total_amount", 0) for c in categories) or tot_sales or 1

    for c in categories:
        amt = c.get("total_amount", 0)
        pct = (amt / total_cat_amount) * 100 if total_cat_amount > 0 else 0
        cat_rows.append([
            Paragraph(c.get("label", c.get("category", "-")), style_cell),
            Paragraph(c.get("unit", "-"), style_cell_center),
            Paragraph(f"{c.get('total_quantity', 0):,} {c.get('unit', '')}".replace(",", "."), style_cell_right),
            Paragraph(f"{c.get('transaction_count', 0)} trx", style_cell_center),
            Paragraph(format_idr(amt), style_cell_right_bold),
            Paragraph(f"{pct:.1f}%", style_cell_right),
        ])

    # Total Cat Row
    cat_rows.append([
        Paragraph("<b>TOTAL KESELURUHAN</b>", style_cell_bold),
        Paragraph("-", style_cell_center),
        Paragraph("-", style_cell_right),
        Paragraph(f"<b>{tot_trx} trx</b>", style_cell_center),
        Paragraph(f"<b>{format_idr(tot_sales)}</b>", style_cell_right_bold),
        Paragraph("<b>100.0%</b>", style_cell_right_bold),
    ])

    t_cat = Table(cat_rows, colWidths=[5.5 * cm, 1.8 * cm, 3.2 * cm, 2.5 * cm, 3.2 * cm, 1.8 * cm])
    t_cat.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 0), (-1, 0), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#F1F5F9")),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
    ]))
    story.append(t_cat)
    story.append(Spacer(1, 14))

    # 5. RINCIAN TRANSAKSI PENJUALAN
    story.append(Paragraph("<b>2. Rincian Riwayat Transaksi Toko</b>", style_section))
    story.append(Spacer(1, 4))

    sales_headers = [
        Paragraph("<b>No Invoice</b>", style_cell_bold),
        Paragraph("<b>Tanggal & Jam</b>", style_cell),
        Paragraph("<b>Kasir</b>", style_cell),
        Paragraph("<b>Metode</b>", style_cell_center),
        Paragraph("<b>Keterangan Item</b>", style_cell),
        Paragraph("<b>Total (Rp)</b>", style_cell_right_bold),
    ]
    sales_rows = [sales_headers]

    sales_list = data.get("recent_sales", [])
    if not sales_list:
        sales_rows.append([
            Paragraph("Belum ada data transaksi yang tercatat pada cabang ini.", style_cell),
            Paragraph("-", style_cell),
            Paragraph("-", style_cell),
            Paragraph("-", style_cell),
            Paragraph("-", style_cell),
            Paragraph("-", style_cell),
        ])
    else:
        for s in sales_list[:40]:  # Limit to 40 per report page
            inv = s.get("invoice_number", "-")
            dt = s.get("created_at", "")[:16].replace("T", " ")
            cashier_name = (s.get("cashier") or {}).get("full_name", "Kasir")
            method = "CASH"
            if s.get("payments"):
                method = s["payments"][0].get("payment_method", "CASH")

            items = s.get("items", [])
            item_desc = ", ".join([
                f"{it.get('product', {}).get('name', 'Item')} ({it.get('quantity', 1)})"
                for it in items[:2]
            ])
            if len(items) > 2:
                item_desc += f" +{len(items)-2} lainnya"

            amt = s.get("final_amount", 0)

            method_color = "#059669" if method == "CASH" else "#0284C7"
            sales_rows.append([
                Paragraph(f"<font size='7' color='#0F172A'><b>{inv}</b></font>", style_cell),
                Paragraph(f"<font size='7'>{dt}</font>", style_cell),
                Paragraph(f"<font size='7'>{cashier_name}</font>", style_cell),
                Paragraph(f"<font size='7' color='{method_color}'><b>{method}</b></font>", style_cell_center),
                Paragraph(f"<font size='7'>{item_desc}</font>", style_cell),
                Paragraph(f"<font size='7'><b>{format_idr(amt)}</b></font>", style_cell_right),
            ])

    t_sales = Table(sales_rows, colWidths=[3.8 * cm, 2.7 * cm, 2.5 * cm, 1.8 * cm, 4.7 * cm, 2.5 * cm])
    t_sales.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 0), (-1, 0), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, c_border),
        ('TOPPADDING', (0, 1), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 2.5),
    ]))
    story.append(t_sales)
    story.append(Spacer(1, 16))

    # 6. SIGNATURE BLOCK
    sig_data = [
        [
            Paragraph("Petugas Kasir Cabang,<br/><br/><br/><br/>( ......................................... )<br/><font size='7' color='#64748B'>Kasir Shift Bertugas</font>", style_cell_center),
            Paragraph("", style_cell),
            Paragraph("Mengetahui & Menyetujui,<br/><br/><br/><br/><b>Bpk. Ahmad (Owner / Super Admin)</b><br/><font size='7' color='#64748B'>Pusat Kendali BB Parfum Kendal</font>", style_cell_center),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[6.5 * cm, 5 * cm, 6.5 * cm])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(KeepTogether([t_sig]))

    doc.build(story)

if __name__ == "__main__":
    if len(sys.argv) > 2:
        json_file = sys.argv[1]
        out_file = sys.argv[2]
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        build_pdf(data, out_file)
    else:
        # Read from stdin
        data = json.loads(sys.stdin.read())
        out_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/store_report.pdf"
        build_pdf(data, out_file)
        print(out_file)
