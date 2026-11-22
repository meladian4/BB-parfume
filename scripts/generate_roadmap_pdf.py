import os
import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Palette Colors (Luxury Dark Slate & Gold Theme)
GOLD = colors.HexColor("#D4AF37")
DARK_GOLD = colors.HexColor("#AA7C11")
LIGHT_GOLD = colors.HexColor("#FDF8E2")
NAVY_DARK = colors.HexColor("#0B132B")
NAVY_LIGHT = colors.HexColor("#1C2541")
SLATE_GRAY = colors.HexColor("#475569")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER_COLOR = colors.HexColor("#CBD5E1")
EMERALD = colors.HexColor("#059669")
EMERALD_BG = colors.HexColor("#ECFDF5")
BLUE = colors.HexColor("#2563EB")
BLUE_BG = colors.HexColor("#EFF6FF")
ROSE = colors.HexColor("#E11D48")
ROSE_BG = colors.HexColor("#FFF1F2")
PURPLE = colors.HexColor("#7C3AED")
PURPLE_BG = colors.HexColor("#FAF5FF")

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(SLATE_GRAY)
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(40, 560, 802, 560)
            self.drawString(40, 568, "BB PARFUM PREMIUM — ROADMAP ALUR PROSES DATA DARI AWAL HINGGA AKHIR")
            self.drawRightString(802, 568, "1 Gudang Distribusi + 3 Cabang Ritel Kendal")

        # Footer
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(40, 35, 802, 35)
        self.drawString(40, 24, "Dokumen Resmi Sistem Manajemen BB Parfum • Hak Cipta Dilindungi • Kendal, Jawa Tengah")
        page_text = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(802, 24, page_text)
        self.restoreState()

def create_roadmap_pdf(output_path):
    # A4 Landscape (841.89 x 595.27 points)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A4),
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    style_main_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=NAVY_DARK
    )
    style_subtitle = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=SLATE_GRAY
    )
    style_section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=NAVY_DARK,
        spaceAfter=6
    )
    style_card_title = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=NAVY_DARK
    )
    style_card_body = ParagraphStyle(
        'CardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=SLATE_GRAY
    )
    style_badge = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white
    )
    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=NAVY_DARK
    )
    style_table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=NAVY_DARK
    )

    story = []

    # =========================================================================
    # HALAMAN 1: COVER & PETA ALUR MAKRO SISTEM (END-TO-END OVERVIEW)
    # =========================================================================
    
    # Header Banner
    header_data = [
        [
            Paragraph("<b>BB PARFUM</b> <font color='#D4AF37'>PREMIUM</font>", style_main_title),
            Paragraph("<b>STATUS SISTEM:</b> <font color='#059669'>AKTIF & TERVERIFIKASI 100%</font><br/><font color='#64748B'>Konteks Operasional: Kendal Multi-Store</font>", ParagraphStyle('HRight', parent=styles['Normal'], alignment=2, fontSize=9, leading=12))
        ]
    ]
    t_header = Table(header_data, colWidths=[500, 262])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    
    story.append(Paragraph("<b>ROADMAP ARSITEKTUR & ALUR PROSES DATA DARI AWAL SAMPAI AKHIR</b>", ParagraphStyle('Sub', fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=DARK_GOLD)))
    story.append(Paragraph("Panduan visual komprehensif perjalanan data: mulai dari Pengadaan Suplai Pabrik ➔ Rantai Mutasi Gudang ➔ Kasir POS & Member ➔ Laporan Laba Rugi ➔ Rekonsiliasi & Backup Data.", style_subtitle))
    story.append(Spacer(1, 10))

    # Info 4 Lokasi Kendal
    loc_data = [
        [
            Paragraph("<b>WH-KENDAL-01</b><br/><font color='#0369A1'>Gudang Pusat Distribusi</font><br/>Penerimaan PO & Buffer Stock", style_card_body),
            Paragraph("<b>STORE-KDL-01</b><br/><font color='#B45309'>Toko 1 - Kendal Kota</font><br/>Jl. Pemuda (Area Komersial)", style_card_body),
            Paragraph("<b>STORE-PGD-02</b><br/><font color='#047857'>Toko 2 - Pegandon</font><br/>Jl. Raya Pegandon (Pasar)", style_card_body),
            Paragraph("<b>STORE-KLW-03</b><br/><font color='#6D28D9'>Toko 3 - Kaliwungu</font><br/>Jl. Raya Kaliwungu (Industri)", style_card_body),
        ]
    ]
    t_loc = Table(loc_data, colWidths=[190, 190, 190, 192])
    t_loc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), BLUE_BG),
        ('BACKGROUND', (1,0), (1,0), LIGHT_GOLD),
        ('BACKGROUND', (2,0), (2,0), EMERALD_BG),
        ('BACKGROUND', (3,0), (3,0), PURPLE_BG),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_loc)
    story.append(Spacer(1, 14))

    # Diagram Makro 7 Fase Data Flow
    story.append(Paragraph("<b>DIAGRAM MAKRO: SIKLUS HIDUP DATA 7 FASE (END-TO-END DATA LIFECYCLE)</b>", style_section_title))
    
    macro_flow = [
        [
            Paragraph("<b>FASE 1</b><br/>Pengadaan Suplai<br/>PO Supplier & HPP", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 2</b><br/>Distribusi Mutasi<br/>Gudang ke 3 Cabang", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 3</b><br/>Shift Kasir POS<br/>Modal Laci Tunai", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 4</b><br/>Kasir & Member<br/>Checkout & Poin", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 5</b><br/>Tutup Laci Kas<br/>Rekonsiliasi Shift", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 6</b><br/>Keuangan OPEX<br/>Laba Rugi Cabang", style_card_title),
            Paragraph("➔", ParagraphStyle('Arr', alignment=1, fontSize=14, textColor=GOLD)),
            Paragraph("<b>FASE 7</b><br/>Audit & Backup<br/>Snapshot Data", style_card_title),
        ]
    ]
    t_macro = Table(macro_flow, colWidths=[80, 16, 82, 16, 80, 16, 80, 16, 80, 16, 80, 16, 80])
    t_macro.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_macro)
    story.append(Spacer(1, 14))

    # Ringkasan Manfaat Utama Bisnis
    summary_cards = [
        [
            Paragraph("<b>🛡️ PENCEGAHAN FRAUD & KEBOCORAN</b><br/>• Kasir Store-Locking (terkunci pada toko sendiri)<br/>• Mutasi Status 3 Tahap (In-Transit terkunci)<br/>• Larangan Pos Akun (Kasir dilarang lihat laba)", style_card_body),
            Paragraph("<b>⚡ PERHITUNGAN OTOMATIS REAL-TIME</b><br/>• Moving Average Cost (HPP Tertimbang)<br/>• Snapshot HPP saat kasir memindai barcode<br/>• Rekonsiliasi modal kasir selisih Rp 0", style_card_body),
            Paragraph("<b>📈 STRATEGI OMZET & RETENSI</b><br/>• Poin Member terintegrasi di 3 Cabang Kendal<br/>• Tukar poin langsung memotong nota struk<br/>• Buku Besar Loyalitas (Loyalty Ledger)", style_card_body),
            Paragraph("<b>💾 KEAMANAN INVESTASI JANGKA PANJANG</b><br/>• Laporan Keuangan per cabang otomatis<br/>• Audit Trail permanen setiap aksi sistem<br/>• 1-Click Database Backup Snapshot JSON", style_card_body),
        ]
    ]
    t_summary = Table(summary_cards, colWidths=[190, 190, 190, 192])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_summary)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 2: DETAIL FASE 1, 2, 3, 4 (PENGADAAN, MUTASI & TRANSAKSI KASIR)
    # =========================================================================
    story.append(Paragraph("<b>FASE 1 HINGGA 4: ALUR PENGADAAN, MUTASI STOK & PENJUALAN KASIR</b>", style_section_title))
    story.append(Paragraph("Langkah detail bagaimana data diciptakan, divalidasi, dan ditransformasi dari hulu (supplier) ke hilir (pelanggan toko).", style_subtitle))
    story.append(Spacer(1, 8))

    fase1_4_data = [
        [
            Paragraph("<b>FASE</b>", style_table_header),
            Paragraph("<b>AKTOR / POS</b>", style_table_header),
            Paragraph("<b>DATA MASUKAN (INPUT)</b>", style_table_header),
            Paragraph("<b>LOGIKA & PROSES SISTEM</b>", style_table_header),
            Paragraph("<b>OUTPUT & EFEK DATA</b>", style_table_header)
        ],
        # Fase 1
        [
            Paragraph("<b>FASE 1:</b><br/>Pengadaan Suplai & Penerimaan PO", style_table_cell_bold),
            Paragraph("<font color='#0369A1'><b>Staf Logistik</b></font><br/>Gudang Pusat", style_table_cell),
            Paragraph("• Supplier, No Faktur<br/>• SKU Produk & Jumlah Beli<br/>• Harga Beli Satuan Baru", style_table_cell),
            Paragraph("1. Generate Purchase Order.<br/>2. Update Saldo Gudang.<br/>3. <b>Kalkulasi Moving Average HPP:</b><br/><i>(Qty Lama × HPP Lama + Qty Baru × Harga Baru) ÷ Qty Total</i>", style_table_cell),
            Paragraph("• Stok Gudang bertambah.<br/>• HPP Tertimbang terupdate.<br/>• Kartu Stok Movement <code>PURCHASE_RECEIPT</code> tercatat.", style_table_cell)
        ],
        # Fase 2
        [
            Paragraph("<b>FASE 2:</b><br/>Mutasi Stok Antar-Cabang", style_table_cell_bold),
            Paragraph("<font color='#0369A1'><b>Staf Logistik</b></font> ➔<br/><font color='#B45309'><b>Kepala Toko</b></font>", style_table_cell),
            Paragraph("• Cabang Tujuan (KDL/PGD/KLW)<br/>• Daftar SKU & Kuantitas<br/>• Surat Jalan Transfer", style_table_cell),
            Paragraph("1. Status <code>PENDING_SHIPMENT</code> dibuat.<br/>2. Gudang klik Kirim ➔ Status <code>IN_TRANSIT</code> (Stok Gudang langsung terpotong).<br/>3. Cabang klik <code>Konfirmasi Terima</code>.", style_table_cell),
            Paragraph("• Stok Cabang resmi bertambah.<br/>• HPP Gudang tersalin proporsional ke Cabang.<br/>• Status mutasi selesai <code>RECEIVED</code>. Tidak ada barang hilang di jalan.", style_table_cell)
        ],
        # Fase 3
        [
            Paragraph("<b>FASE 3:</b><br/>Buka Shift Kasir & Laci Tunai", style_table_cell_bold),
            Paragraph("<font color='#047857'><b>Kasir Toko</b></font><br/>Toko Ritel Cabang", style_table_cell),
            Paragraph("• Kredensial Login Kasir<br/>• Modal Kas Awal Fisik<br/>(e.g. Rp 300.000)", style_table_cell),
            Paragraph("1. <b>Enforce Store-Locking:</b> Kasir divalidasi hanya bisa buka di tokonya.<br/>2. Cek apakah ada sesi ganda.<br/>3. Buat Cash Session status <code>OPEN</code>.", style_table_cell),
            Paragraph("• Sesi kasir aktif ber-ID resmi.<br/>• Laci kas terkunci siap transaksi.<br/>• Audit log <code>CASH_SESSION_OPENED</code> terbit.", style_table_cell)
        ],
        # Fase 4
        [
            Paragraph("<b>FASE 4:</b><br/>POS Checkout & Pemotongan Atomik", style_table_cell_bold),
            Paragraph("<font color='#047857'><b>Kasir Toko</b></font><br/>Toko Ritel Cabang", style_table_cell),
            Paragraph("• Scan Barcode Botol Parfum<br/>• No HP Member Loyalty<br/>• Pilihan Tukar Poin<br/>• Metode Bayar (Tunai/QRIS)", style_table_cell),
            Paragraph("1. Cek kecukupan stok cabang.<br/>2. Kunci <b>Idempotency Key</b> (anti double billing).<br/>3. Hitung diskon member.<br/>4. Potong stok cabang seketika.<br/>5. Snapshot HPP berjalan.", style_table_cell),
            Paragraph("• Invoice Penjualan Resmi terbit.<br/>• Poin Member bertambah (+1 pt per Rp 10rb).<br/>• Stok cabang terpotong akurat.<br/>• Cetak Struk 58mm/80mm.", style_table_cell)
        ]
    ]

    t_fase1_4 = Table(fase1_4_data, colWidths=[130, 95, 160, 217, 160])
    t_fase1_4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_DARK),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_fase1_4)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 3: FASE 5 & 6 (REKONSILIASI KASIR, MEMBER LOYALTY, LAPORAN LABA RUGI)
    # =========================================================================
    story.append(Paragraph("<b>FASE 5 & 6: REKONSILIASI KASIR, BUKU BESAR POIN & LABA RUGI CABANG</b>", style_section_title))
    story.append(Paragraph("Bagaimana sistem menjamin akurasi fisik laci kas dan menghasilkan laporan keuangan otomatis tanpa sentuhan Excel.", style_subtitle))
    story.append(Spacer(1, 8))

    fase5_6_data = [
        [
            Paragraph("<b>FASE</b>", style_table_header),
            Paragraph("<b>AKTOR / POS</b>", style_table_header),
            Paragraph("<b>DATA MASUKAN (INPUT)</b>", style_table_header),
            Paragraph("<b>LOGIKA & PROSES SISTEM</b>", style_table_header),
            Paragraph("<b>OUTPUT & EFEK DATA</b>", style_table_header)
        ],
        # Fase 5
        [
            Paragraph("<b>FASE 5:</b><br/>Tutup Shift & Rekonsiliasi Kasir", style_table_cell_bold),
            Paragraph("<font color='#047857'><b>Kasir Toko</b></font><br/>Toko Ritel Cabang", style_table_cell),
            Paragraph("• Penghitungan Uang Fisik di Laci saat akhir shift.<br/>• Catatan operasional kasir.", style_table_cell),
            Paragraph("1. Hitung <code>Expected Cash = Opening Cash + Penjualan Tunai</code>.<br/>2. Bandingkan dengan Uang Fisik.<br/>3. Hitung <code>Selisih (Difference)</code>.<br/>4. Tutup sesi ➔ <code>CLOSED</code>.", style_table_cell),
            Paragraph("• Laporan Rekonsiliasi Laci Kasir.<br/>• Catatan selisih kas (Audit Target: Rp 0).<br/>• Tanggung jawab kasir per shift terkunci transparan.", style_table_cell)
        ],
        # Fase 6
        [
            Paragraph("<b>FASE 6A:</b><br/>Loyalty Ledger & Retensi Member", style_table_cell_bold),
            Paragraph("<font color='#7C3AED'><b>Sistem Loyalty</b></font><br/>Toko 1, 2, 3 Kendal", style_table_cell),
            Paragraph("• ID Member Pelanggan.<br/>• Belanja POS (Earn) atau Diskon Kasir (Redeem).", style_table_cell),
            Paragraph("1. Tambah poin: <code>+1 per Rp 10.000 belanja</code>.<br/>2. Tukar poin: <code>1 poin = Diskon Rp 1.000</code>.<br/>3. Validasi batas minimal saldo (10 Poin).<br/>4. Catat mutasi Buku Besar (Ledger).", style_table_cell),
            Paragraph("• Saldo Poin Member terupdate seketika.<br/>• Riwayat transaksi <code>EARN</code>, <code>REDEEM</code>, atau <code>REVERSAL</code> tercatat mutlak anti-curang.", style_table_cell)
        ],
        # Fase 6B
        [
            Paragraph("<b>FASE 6B:</b><br/>Beban OPEX & Laporan Keuangan", style_table_cell_bold),
            Paragraph("<font color='#D4AF37'><b>Super Admin</b></font><br/>Direksi / Owner", style_table_cell),
            Paragraph("• Biaya Sewa Ruko Cabang<br/>• Beban Listrik & Internet<br/>• Gaji Karyawan Toko<br/>• Biaya Packaging & Paper Bag", style_table_cell),
            Paragraph("<b>Kalkulasi 3 Lapisan Finansial:</b><br/>1. <code>Net Sales = Gross Sales - Diskon Member</code><br/>2. <code>Gross Profit = Net Sales - COGS (HPP Snapshot)</code><br/>3. <code>Net Operating Profit = Gross Profit - Biaya OPEX</code>", style_table_cell),
            Paragraph("• Laporan Laba Rugi Real-Time per Toko Cabang.<br/>• Laba Bersih Konsolidasi Seluruh Kendal.<br/>• Evaluasi profitabilitas per cabang (Kendal Kota, Pegandon, Kaliwungu).", style_table_cell)
        ]
    ]

    t_fase5_6 = Table(fase5_6_data, colWidths=[130, 95, 160, 217, 160])
    t_fase5_6.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_DARK),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_fase5_6)
    story.append(Spacer(1, 10))

    # Box Rumus Finansial
    formula_box = [
        [
            Paragraph("<b>RUMUS RESMI AKUNTANSI RITEL BB PARFUM:</b>", ParagraphStyle('FHead', fontName='Helvetica-Bold', fontSize=8, textColor=DARK_GOLD)),
            Paragraph("<b>Penjualan Bersih</b> = Penjualan Kotor - Diskon Loyalty Member", style_table_cell),
            Paragraph("<b>Laba Kotor (Gross Profit)</b> = Penjualan Bersih - HPP Barang Terjual (COGS)", style_table_cell),
            Paragraph("<b>Laba Operasional Cabang</b> = Laba Kotor - Biaya OPEX (Sewa, Gaji, Listrik, Kemasan)", style_table_cell),
        ]
    ]
    t_formula = Table(formula_box, colWidths=[180, 190, 200, 192])
    t_formula.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_GOLD),
        ('BOX', (0,0), (-1,-1), 0.5, GOLD),
        ('INNERGRID', (0,0), (-1,-1), 0.5, GOLD),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_formula)

    story.append(PageBreak())

    # =========================================================================
    # HALAMAN 4: FASE 7 (AUDIT TRAIL, REKONSILIASI & DISASTER BACKUP) + HAK AKSES
    # =========================================================================
    story.append(Paragraph("<b>FASE 7: KEAMANAN AKSES, AUDIT TRAIL & PERLINDUNGAN DATA (BACKUP)</b>", style_section_title))
    story.append(Paragraph("Pilar penegakan integritas data, transparansi jejak aktivitas staf, dan jaminan keamanan bisnis tanpa kehilangan data.", style_subtitle))
    story.append(Spacer(1, 8))

    # Matriks Larangan Hak Akses
    story.append(Paragraph("<b>MATRIKS PEMBATASAN & LARANGAN OTORITAS TIAP POS AKUN:</b>", ParagraphStyle('SubM', fontName='Helvetica-Bold', fontSize=10, textColor=NAVY_DARK)))
    
    role_matrix = [
        [
            Paragraph("<b>POS AKUN</b>", style_table_header),
            Paragraph("<b>CAKUPAN LOKASI</b>", style_table_header),
            Paragraph("<b>HAK AKSES YANG DIIZINKAN</b>", style_table_header),
            Paragraph("<b>LARANGAN & PEMBATASAN KETAT (STRICT PROHIBITIONS)</b>", style_table_header)
        ],
        [
            Paragraph("<b>KASIR RITEL</b><br/>(CASHIER)", style_table_cell_bold),
            Paragraph("Terkunci pada 1 Toko Cabang<br/>(KDL-01 / PGD-02 / KLW-03)", style_table_cell),
            Paragraph("• Buka & Tutup Sesi Laci Kasir<br/>• Scan Barcode Transaksi POS<br/>• Cek Poin & Redeem Member<br/>• Cetak Struk Belanja", style_table_cell),
            Paragraph("<font color='#E11D48'>❌ Dilarang lihat laporan Laba Rugi & HPP<br/>❌ Dilarang lihat & ubah biaya OPEX<br/>❌ Dilarang ditugaskan ke Gudang Pusat<br/>❌ Dilarang akses data cabang toko lain</font>", style_table_cell)
        ],
        [
            Paragraph("<b>LOGISTIK & GUDANG</b><br/>(LOGISTICS)", style_table_cell_bold),
            Paragraph("Terkunci pada Gudang Distribusi<br/>(WH-KENDAL-01)", style_table_cell),
            Paragraph("• Terima PO Suplai dari Supplier<br/>• Kirim Transfer Stok ke 3 Toko<br/>• Stok Opname Fisik Gudang<br/>• Monitoring Buffer Stok Menipis", style_table_cell),
            Paragraph("<font color='#E11D48'>❌ Dilarang transaksi penjualan kasir POS<br/>❌ Dilarang membuka sesi laci kas tunai<br/>❌ Dilarang akses laporan keuangan & dividen<br/>❌ Dilarang ubah atau reset akun pengguna lain</font>", style_table_cell)
        ],
        [
            Paragraph("<b>SUPER ADMIN</b><br/>(SUPER_ADMIN)", style_table_cell_bold),
            Paragraph("Akses Penuh Seluruh Lokasi<br/>(1 Gudang + 3 Cabang Toko)", style_table_cell),
            Paragraph("• Monitoring Laporan Laba Rugi Konsolidasian<br/>• Edit Profil Pengguna & Ganti Role<br/>• 1-Click Reset Password Akun Kasir<br/>• Ekspor Database Backup Snapshot JSON", style_table_cell),
            Paragraph("<font color='#059669'>🔒 Super Admin utama tidak dapat dihapus/dinonaktifkan.<br/>🔒 Jejak Audit Trail bersifat permanen (Append-Only).</font>", style_table_cell)
        ]
    ]

    t_roles = Table(role_matrix, colWidths=[120, 140, 240, 262])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY_DARK),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 10))

    # Audit Trail & Backup Box
    audit_data = [
        [
            Paragraph("<b>AUDIT TRAIL OTOMATIS (IMMUTABLE LOG)</b><br/>Setiap mutasi stok, penerimaan barang, reset password, transaksi kasir, dan penyesuaian poin tersimpan dengan identitas user, IP, dan timestamp WIB.", style_card_body),
            Paragraph("<b>REKONSILIASI BERKALA (100% MATCH)</b><br/>Sistem mencocokkan total saldo fisik dengan kartu pergerakan stok. Hasil uji sistem: 20/20 record produk-toko dan 3/3 akun member klop 100%.", style_card_body),
            Paragraph("<b>1-CLICK DATABASE BACKUP SNAPSHOT</b><br/>Pemilik bisnis dapat mengunduh salinan lengkap database dalam format JSON kapan saja dari menu Pengaturan untuk kebutuhan cadangan darurat.", style_card_body),
        ]
    ]
    t_audit = Table(audit_data, colWidths=[250, 255, 257])
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_audit)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ PDF Roadmap berhasil dibuat: {output_path}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "Roadmap_Proses_Data_BB_Parfum.pdf"
    create_roadmap_pdf(out)
