import os
import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.pdfgen import canvas

# Palette
GOLD = colors.HexColor("#D4AF37")
DARK_GOLD = colors.HexColor("#AA7C11")
LIGHT_GOLD = colors.HexColor("#FDF8E2")
NAVY_BG = colors.HexColor("#070B13")
SLATE_CARD = colors.HexColor("#0F1726")
SLATE_CARD_ALT = colors.HexColor("#141D30")
SLATE_BORDER = colors.HexColor("#26354D")
TEXT_MUTED = colors.HexColor("#94A3B8")
TEXT_WHITE = colors.HexColor("#F8FAFC")
TEXT_SUB = colors.HexColor("#CBD5E1")
EMERALD = colors.HexColor("#10B981")
BLUE = colors.HexColor("#3B82F6")
ROSE = colors.HexColor("#F43F5E")
PURPLE = colors.HexColor("#A855F7")

def draw_slide_background(cvs, doc):
    """Draws background and borders BEFORE flowables are drawn onto the page."""
    cvs.saveState()
    # 1. Full page dark luxury background
    cvs.setFillColor(NAVY_BG)
    cvs.rect(0, 0, 841.89, 595.27, fill=1, stroke=0)

    # 2. Gold top accent ribbon
    cvs.setFillColor(GOLD)
    cvs.rect(40, 562, 762, 3, fill=1, stroke=0)

    # 3. Top branding text
    cvs.setFont("Helvetica-Bold", 8.5)
    cvs.setFillColor(GOLD)
    cvs.drawString(40, 572, "BB PARFUM PREMIUM")
    cvs.setFont("Helvetica", 8)
    cvs.setFillColor(TEXT_MUTED)
    cvs.drawString(145, 572, "• Sistem Manajemen Ritel Multi-Cabang & Rantai Pasok Kendal")

    # 4. Bottom footer separator
    cvs.setStrokeColor(SLATE_BORDER)
    cvs.setLineWidth(0.5)
    cvs.line(40, 32, 802, 32)
    cvs.setFont("Helvetica", 8)
    cvs.setFillColor(TEXT_MUTED)
    cvs.drawString(40, 20, "Proposal & Prototipe Sistem BB Parfum Kendal • 1 Gudang Pusat + 3 Cabang Toko (Kendal Kota, Pegandon, Kaliwungu)")
    cvs.drawRightString(802, 20, "http://localhost:3005 • Hak Cipta Dilindungi")
    cvs.restoreState()

class SlideCanvas(canvas.Canvas):
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
            # ONLY draw the slide counter on top! NEVER draw a background rect here!
            self.draw_slide_counter(num_pages)
            super().showPage()
        super().save()

    def draw_slide_counter(self, total_slides):
        self.saveState()
        self.setFont("Helvetica-Bold", 8.5)
        self.setFillColor(GOLD)
        counter_text = f"SLIDE {self._pageNumber} / {total_slides}"
        self.drawRightString(802, 572, counter_text)
        self.restoreState()

def create_slides_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A4),
        leftMargin=40,
        rightMargin=40,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    s_slide_title = ParagraphStyle(
        'STitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=19,
        leading=23,
        textColor=TEXT_WHITE
    )
    s_slide_subtitle = ParagraphStyle(
        'SSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_MUTED,
        spaceAfter=10
    )
    s_card_head = ParagraphStyle(
        'CHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=GOLD
    )
    s_card_body = ParagraphStyle(
        'CBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_SUB
    )
    s_card_metric = ParagraphStyle(
        'CMetric',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=19,
        textColor=GOLD
    )

    story = []

    slides_content = [
        # SLIDE 1
        {
            "badge": "PROPOSAL EKSEKUTIF & PROTOTIPE SIAP-PAKAI",
            "title": "BB PARFUM PREMIUM — SISTEM MANAJEMEN RITEL TERPADU",
            "sub": "Solusi Ritel Parfum Modern: 1 Gudang Distribusi Pusat + 3 Cabang Toko Kendal dalam 1 Kendali Penuh.",
            "cards": [
                ("100% STOK TERKUNCI", "Pencegahan kebocoran mutasi fisik dari Gudang ke Cabang Toko dengan status pengiriman In-Transit."),
                ("0 DETIK REKAP LABA", "Penjualan Bersih, HPP (COGS), dan beban OPEX terhitung otomatis setiap kali ada transaksi kasir."),
                ("KASIR STORE-LOCKING", "Kasir terkunci pada cabangnya sendiri, dilarang mengakses stok cabang lain maupun gudang."),
                ("BUKU BESAR LOYALTY", "Pelanggan setia mendapat poin belanja (Rp 10.000 = 1 Poin) yang berlaku di ketiga cabang Kendal.")
            ]
        },
        # SLIDE 2
        {
            "badge": "ANALISIS MASALAH RITEL",
            "title": "4 TITIK KEBOCORAN FINANSIAL DI BISNIS PARFUM",
            "sub": "Tantangan operasional yang menggerus profit 8–15% setiap bulan tanpa adanya sistem digital terpadu.",
            "cards": [
                ("1. Kebocoran Stok Mutasi", "Barang dikirim ke toko cabang sering selisih karena surat jalan manual tidak terkunci status pengiriman."),
                ("2. HPP Mengambang & Laba Semu", "Harga beli bibit supplier naik turun tanpa moving average, menghasilkan laporan laba fiktif."),
                ("3. Uang Kasir Sering Minus", "Pergantian shift kasir tanpa input modal laci dan tanpa rekonsiliasi selisih harian terbukti rawan fraud."),
                ("4. Member Tidak Terikat", "Pelanggan setia Kendal Kota tidak dikenali di Kaliwungu karena data member terpisah-pisah di tiap toko.")
            ]
        },
        # SLIDE 3
        {
            "badge": "ARSITEKTUR HUB & SPOKE",
            "title": "EKOSISTEM 1 GUDANG + 3 TOKO CABANG KENDAL",
            "sub": "Integrasi menyeluruh antara Pusat Pasokan dan Gerai Ritel Konsumen di Wilayah Kabupaten Kendal.",
            "cards": [
                ("WH-KENDAL-01 (Gudang)", "Pusat penerimaan suplai pabrik, peracikan, dan penyimpanan stok penyangga (buffer stock) aman."),
                ("STORE-KDL-01 (Kendal Kota)", "Jl. Pemuda No. 42 (Pusat Kota). Konsumsi botol 50ml tertinggi dengan volume transaksi kasir aktif."),
                ("STORE-PGD-02 (Pegandon)", "Jl. Raya Pegandon No. 18. Melayani konsumen area pasar & pemukiman Kendal Selatan."),
                ("STORE-KLW-03 (Kaliwungu)", "Jl. Raya Kaliwungu No. 88. Koridor mobilitas komuter Kendal-Semarang & area industri.")
            ]
        },
        # SLIDE 4
        {
            "badge": "LAYAR 1: KASIR POINT OF SALE",
            "title": "KASIR POS CEPAT, STORE-LOCKING & CETAK STRUK",
            "sub": "Proses checkout di bawah 1 menit per pelanggan, pencegahan fraud kasir, dan integrasi printer thermal.",
            "cards": [
                ("Buka Shift Wajib", "Kasir wajib menginput modal awal laci fisik (misal Rp 300.000) sebelum melayani pembeli pertama."),
                ("Barcode Scanner Cepat", "Membaca kode SKU 30ml, 50ml, 100ml instan untuk menghindari kesalahan varian aroma."),
                ("Kasir Store-Locking", "Kasir hanya diizinkan menjual barang di cabangnya, dilarang memotong stok cabang lain."),
                ("Cetak Nota 58/80mm", "Format struk kasir profesional langsung tercetak dengan info perolehan poin diskon member.")
            ]
        },
        # SLIDE 5
        {
            "badge": "LAYAR 2: RANTAI PASOK LOGISTIK",
            "title": "PENGADAAN SUPLAI & MUTASI STATUS 3-TAHAP",
            "sub": "Pencegahan barang 'hilang di jalan' dan otomasi kalkulasi Moving Average Cost (HPP Tertimbang).",
            "cards": [
                ("Purchase Order Supplier", "Pencatatan faktur supplier dan harga beli baru untuk mengkalkulasi HPP real-time tanpa tebak-tebakan."),
                ("Moving Average HPP", "HPP dihitung otomatis: (Stok Lama × HPP Lama + Stok Baru × Harga Baru) ÷ Total Stok Gabungan."),
                ("Status Mutasi In-Transit", "Alur aman: PENDING ➔ IN_TRANSIT (terpotong di gudang) ➔ RECEIVED (resmi masuk cabang)."),
                ("Buffer Alert Stok", "Peringatan dini otomatis jika ada varian parfum yang stok fisiknya tersisa di bawah 5 botol.")
            ]
        },
        # SLIDE 6
        {
            "badge": "LAYAR 3: RETENSI PELANGGAN",
            "title": "PROGRAM LOYALITAS MEMBER & BUKU BESAR POIN",
            "sub": "Membangun pelanggan fanatik di seluruh Kendal dengan sistem rewards transparan dan anti-curang.",
            "cards": [
                ("1 Akun untuk 3 Toko", "Member cukup menyebut nomor WhatsApp di kasir mana saja, poin otomatis tersambung."),
                ("Formula Poin Resmi", "Belanja Rp 10.000 = +1 Poin. Tiap 1 Poin bernilai diskon Rp 1.000 langsung memotong nota struk."),
                ("Buku Besar (Ledger)", "Setiap perolehan (Earn), penukaran (Redeem), dan pembatalan (Reversal) tercatat abadi di buku besar."),
                ("Anti Double Redeem", "Sistem memvalidasi batas saldo dan mencegah invoice yang sama menukar poin dua kali.")
            ]
        },
        # SLIDE 7
        {
            "badge": "LAYAR 4: KEUANGAN & LABA RUGI",
            "title": "LAPORAN FINANSIAL REAL-TIME & LABA BERSIH TOKO",
            "sub": "Otomasi 3 lapisan akuntansi ritel tanpa perlu lagi merekap nota manual dengan spreadsheet Excel.",
            "cards": [
                ("Layer 1: Penjualan Bersih", "Net Sales = Total Penjualan Kotor (Gross Sales) dikurangi Diskon Poin Member."),
                ("Layer 2: Laba Kotor (COGS)", "Gross Profit = Penjualan Bersih dikurangi Snapshot HPP Riil saat transaksi kasir."),
                ("Layer 3: Laba Operasional", "Net Operating Profit = Laba Kotor dikurangi Beban OPEX (Sewa Ruko, Gaji, Listrik, Kemasan)."),
                ("Komparasi 3 Toko", "Melihat kontribusi omzet dan profitabilitas Kendal Kota vs Pegandon vs Kaliwungu.")
            ]
        },
        # SLIDE 8
        {
            "badge": "LAYAR 5: HAK AKSES & LARANGAN",
            "title": "MATRIKS LARANGAN KETAT TIAP POS AKUN (ANTI-FRAUD)",
            "sub": "Pemisahan wewenang ketat untuk menjaga kerahasiaan data margin dan mencegah moral hazard.",
            "cards": [
                ("Pos Kasir (Cashier)", "Hanya transaksi POS & laci kas. Dilarang intip laba rugi, HPP, OPEX, atau akses gudang."),
                ("Pos Logistik (Gudang)", "Hanya kelola PO & mutasi stok. Dilarang jualan kasir ritel dan dilarang lihat laba dividen."),
                ("Pos Super Admin", "Akses 360°: Evaluasi laba rugi, edit data user, reset password kasir, toggle aktif/cuti."),
                ("Perlindungan Keamanan", "Super Admin utama tidak bisa dihapus dan seluruh audit trail tersimpan permanen.")
            ]
        },
        # SLIDE 9
        {
            "badge": "LAYAR 6: INTEGRITAS & BACKUP",
            "title": "REKONSILIASI OTOMATIS & DISASTER RECOVERY BACKUP",
            "sub": "Jaminan konsistensi saldo fisik dengan kartu stok, audit trail abadi, dan backup database 1-Click.",
            "cards": [
                ("Rekonsiliasi Stok 100%", "Saldo fisik vs penjumlahan mutasi terbukti 100% klop (20/20 record produk-toko)."),
                ("Rekonsiliasi Laci Kasir", "Pencocokan uang tunai fisik laci kasir saat tutup shift dengan target selisih Rp 0."),
                ("Immutable Audit Trail", "Setiap aksi (ganti harga, reset password, mutasi barang) tercatat dengan timestamp WIB."),
                ("1-Click Backup Snapshot", "Download salinan lengkap database dalam format JSON kapan saja untuk cadangan darurat.")
            ]
        },
        # SLIDE 10
        {
            "badge": "KESIMPULAN & NILAI INVESTASI",
            "title": "RENCANA IMPLEMENTASI & RETURN ON INVESTMENT (ROI)",
            "sub": "Mengapa mengadopsi sistem BB Parfum memberikan keuntungan bisnis terukur dan siap pakai hari ini.",
            "cards": [
                ("Waktu Rekap: 0 Hari", "Waktu rekap bulanan terpangkas dari 3-5 hari menjadi 0 detik karena data terbit real-time."),
                ("Akurasi Stok: > 99%", "Kebocoran stok dari gudang ke toko ditekan hingga mendekati 0% berkat status In-Transit."),
                ("Proyeksi Repeat Order +25%", "Dukungan membership terintegrasi mendorong pelanggan kembali membeli parfum di Kendal."),
                ("100% Siap Operasional", "Sistem sudah selesai dibangun, lolos seluruh pengujian (test:all 100%), dan aktif berjalan.")
            ]
        }
    ]

    for idx, sl in enumerate(slides_content):
        # Badge
        badge_table = Table([[
            Paragraph(f"<font color='#070A0F'><b>{sl['badge']}</b></font>", ParagraphStyle('Bdg', fontName='Helvetica-Bold', fontSize=7.5, leading=10))
        ]], colWidths=[260])
        badge_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), GOLD),
            ('TOPPADDING', (0,0), (-1,-1), 2.5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(badge_table)
        story.append(Spacer(1, 4))

        # Title & Subtitle
        story.append(Paragraph(sl['title'], s_slide_title))
        story.append(Paragraph(sl['sub'], s_slide_subtitle))

        # 4 Cards Layout
        card_cells = []
        for ctitle, cdesc in sl['cards']:
            cell_content = [
                Paragraph(f"<b>{ctitle}</b>", s_card_head),
                Spacer(1, 4),
                Paragraph(cdesc, s_card_body)
            ]
            card_cells.append(cell_content)

        c_table_data = [
            [card_cells[0], card_cells[1]],
            [card_cells[2], card_cells[3]]
        ]

        t_cards = Table(c_table_data, colWidths=[376, 376])
        t_cards.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), SLATE_CARD),
            ('BOX', (0,0), (-1,-1), 1, SLATE_BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 14),
            ('BOTTOMPADDING', (0,0), (-1,-1), 14),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('RIGHTPADDING', (0,0), (-1,-1), 14),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_cards)

        if idx < len(slides_content) - 1:
            story.append(PageBreak())

    doc.build(
        story,
        canvasmaker=SlideCanvas,
        onFirstPage=draw_slide_background,
        onLaterPages=draw_slide_background
    )
    print(f"✅ Slide PDF berhasil dibuat: {output_path}")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "BB_Parfum_Presentasi_Klien.pdf"
    create_slides_pdf(out)
