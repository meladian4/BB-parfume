// ============================================================================
// Acceptance Tests - TAHAP 1: Fondasi, Autentikasi, Role, Cabang, dan Produk
// BB PARFUM PREMIUM MANAGEMENT SYSTEM
// ============================================================================

import { repository } from '../src/lib/db/repository';
import { requireRole, validateStoreAccess, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '../src/lib/auth/guards';
import { formatIDR, formatDateTimeJakarta } from '../src/lib/formatters';
import { UserProfile } from '../src/types/domain';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage1Tests() {
  console.log('=================================================================');
  console.log('🚀 MEMULAI ACCEPTANCE TEST TAHAP 1 — BB PARFUM PREMIUM');
  console.log('=================================================================\n');

  repository._resetForTesting();

  // --------------------------------------------------------------------------
  // TEST SUITE 1: STRUKTUR LOKASI (1 GUDANG + 3 TOKO KENDAL)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Verifikasi Struktur Lokasi Toko & Gudang Kendal...');
  const stores = await repository.getStores();
  assert(stores.length === 4, `Jumlah store harus 4 (1 Gudang + 3 Toko), didapat: ${stores.length}`);

  const warehouse = stores.find((s) => s.type === 'WAREHOUSE');
  assert(!!warehouse, 'Gudang pusat harus terdaftar');
  assert(warehouse?.code === 'WH-KENDAL-01', `Kode gudang tidak sesuai: ${warehouse?.code}`);

  const storeKendal = stores.find((s) => s.code === 'STORE-KDL-01');
  const storePegandon = stores.find((s) => s.code === 'STORE-PGD-02');
  const storeKaliwungu = stores.find((s) => s.code === 'STORE-KLW-03');
  assert(!!storeKendal && !!storePegandon && !!storeKaliwungu, 'Tiga toko cabang (Kendal Kota, Pegandon, Kaliwungu) harus ada');

  // Test duplikasi kode toko ditolak
  let duplicateRejected = false;
  try {
    await repository.createStore({
      code: 'STORE-KDL-01',
      name: 'Duplikat Toko Kendal',
      type: 'STORE',
      address: 'Jl. Tes',
      is_active: true,
    });
  } catch (err: unknown) {
    duplicateRejected = true;
  }
  assert(duplicateRejected, 'Sistem harus menolak pembuatan toko dengan kode duplikat');
  console.log('  ✅ Lolos: 1 Gudang Pusat dan 3 Cabang terdaftar, duplikasi kode dicegah.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: ROLE DAN HAK AKSES SERVER-SIDE
  // --------------------------------------------------------------------------
  console.log('▶ TEST 2: Role Authorization & Kasir Store-Locking...');
  const adminUser: UserProfile = {
    id: 'u-admin-1',
    email: 'admin@bbparfum.id',
    full_name: 'Super Admin',
    role: 'SUPER_ADMIN',
    assigned_store_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const cashierKendal: UserProfile = {
    id: 'u-cashier-1',
    email: 'kasir.kendal@bbparfum.id',
    full_name: 'Kasir Kendal',
    role: 'CASHIER',
    assigned_store_id: storeKendal!.id,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 2.1 Super Admin izin global
  assert(requireRole(adminUser, ['SUPER_ADMIN']).role === 'SUPER_ADMIN', 'Super admin harus lolos requireRole');
  validateStoreAccess(adminUser, storePegandon!.id); // Harus tidak melempar error

  // 2.2 Kasir diizinkan ke tokonya sendiri
  validateStoreAccess(cashierKendal, storeKendal!.id); // Harus tidak melempar error
  const effectiveStore = resolveEffectiveStoreId(cashierKendal, storePegandon!.id);
  assert(
    effectiveStore === storeKendal!.id,
    `Kasir Kendal tidak boleh dialihkan ke toko lain. Efektif harus: ${storeKendal!.id}, didapat: ${effectiveStore}`
  );

  // 2.3 Kasir DILARANG mengakses toko cabang lain
  let accessDenied = false;
  try {
    validateStoreAccess(cashierKendal, storePegandon!.id);
  } catch (err: unknown) {
    if (err instanceof StoreAccessError) {
      accessDenied = true;
    }
  }
  assert(accessDenied, 'Kasir yang mencoba mengakses toko cabang lain harus ditolak dengan StoreAccessError');

  // 2.4 Kasir mencoba mengakses fitur superadmin (misal: kelola users)
  let unauthorizedAction = false;
  try {
    requireRole(cashierKendal, ['SUPER_ADMIN']);
  } catch (err: unknown) {
    if (err instanceof AuthorizationError) {
      unauthorizedAction = true;
    }
  }
  assert(unauthorizedAction, 'Kasir dilarang mengakses izin SUPER_ADMIN');

  // 2.5 Pembuatan kasir tanpa assigned_store_id harus ditolak
  let cashierWithoutStoreRejected = false;
  try {
    await repository.upsertUserProfile({
      id: 'u-cashier-invalid',
      email: 'invalid.kasir@bbparfum.id',
      full_name: 'Kasir Tanpa Toko',
      role: 'CASHIER',
      assigned_store_id: null,
      is_active: true,
    });
  } catch (err: unknown) {
    cashierWithoutStoreRejected = true;
  }
  assert(cashierWithoutStoreRejected, 'Kasir wajib memiliki assigned_store_id yang valid');
  console.log('  ✅ Lolos: Role authorization dan store locking berfungsi ketat di server-side.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: MASTER PRODUK & KATEGORI PARFUM
  // --------------------------------------------------------------------------
  console.log('▶ TEST 3: Master Produk, Kategori, SKU, dan Barcode Scanner...');
  const categories = await repository.getCategories();
  assert(categories.length >= 4, 'Kategori awal harus tersedia');

  const products = await repository.getProducts();
  assert(products.length >= 5, 'Katalog produk awal harus minimal 5');

  // Cari produk via barcode scanner
  const foundByBarcode = await repository.getProductByBarcodeOrSku('899123456001');
  assert(!!foundByBarcode, 'Produk harus dapat dicari via Barcode');
  assert(foundByBarcode?.sku === 'BBP-SIG-VELVET-50', 'SKU produk barcode cocok');

  // Tambah produk baru
  const newProduct = await repository.createProduct({
    sku: 'BBP-TEST-OUD-30',
    barcode: '899999999001',
    name: 'BB Midnight Oud Tester 30ml',
    category_id: categories[0].id,
    size_ml: 30,
    scent_type: 'Extrait de Parfum',
    top_notes: 'Cardamom',
    middle_notes: 'Rose',
    base_notes: 'Oud',
    base_price: 120000,
    min_stock_alert: 5,
    is_active: true,
  });
  assert(newProduct.id.length > 0, 'Produk baru berhasil dibuat');

  // Validasi duplikasi SKU
  let dupSkuRejected = false;
  try {
    await repository.createProduct({
      sku: 'BBP-TEST-OUD-30',
      barcode: '899999999002',
      name: 'Produk Duplikat SKU',
      size_ml: 50,
      scent_type: 'Eau de Parfum',
      base_price: 100000,
      min_stock_alert: 5,
      is_active: true,
    });
  } catch (err: unknown) {
    dupSkuRejected = true;
  }
  assert(dupSkuRejected, 'Sistem harus menolak produk dengan SKU duplikat');

  // Validasi otomatis saldo inventaris terinisialisasi untuk semua cabang
  const invRows = await repository.getInventoryBalances();
  const balancesForNewProduct = invRows.filter((b) => b.product_id === newProduct.id);
  assert(
    balancesForNewProduct.length === stores.length,
    `Setiap store harus memiliki saldo inventaris awal untuk produk baru (${stores.length}), didapat: ${balancesForNewProduct.length}`
  );
  console.log('  ✅ Lolos: CRUD produk, pencegahan duplikasi SKU/barcode, dan auto-inisialisasi inventaris berhasil.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: FORMATTERS MATA UANG IDR & ZONA WAKTU ASIA/JAKARTA
  // --------------------------------------------------------------------------
  console.log('▶ TEST 4: Format Mata Uang IDR & Zona Waktu Asia/Jakarta (WIB)...');
  const formattedPrice = formatIDR(185000);
  assert(formattedPrice.includes('185.000'), `Format IDR harus Rp 185.000, didapat: ${formattedPrice}`);

  const formattedZero = formatIDR(0);
  assert(formattedZero.includes('0'), `Format IDR nol harus Rp 0, didapat: ${formattedZero}`);

  const testIso = '2026-10-11T12:00:00Z';
  const formattedDate = formatDateTimeJakarta(testIso);
  assert(formattedDate.includes('WIB'), `Format tanggal harus menyertakan penanda WIB, didapat: ${formattedDate}`);
  console.log(`  Formatted Output: ${formattedPrice} | ${formattedDate}`);
  console.log('  ✅ Lolos: Format IDR dan Asia/Jakarta (WIB) akurat.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: MANAJEMEN PENGGUNA OLEH SUPERADMIN & ENFORCEMENT LARANGAN POS
  // --------------------------------------------------------------------------
  console.log('▶ TEST 5: Manajemen Pengguna (Edit, Reset Password, Toggle Status, Proteksi Superadmin)...');

  // Ambil list user yang ada di repository
  const initialUsers = await repository.getUsers();
  assert(initialUsers.length >= 3, 'Harus memiliki minimal 3 pengguna awal');

  const targetCashier = initialUsers.find((u) => u.role === 'CASHIER');
  assert(!!targetCashier, 'Harus ada akun kasir untuk diuji');

  // 5.1 Super Admin mengedit profil pengguna (nama dan toko penugasan)
  const updatedUser = await repository.updateUserProfile(targetCashier!.id, {
    full_name: 'Kasir Kendal Diperbarui',
    assigned_store_id: storePegandon!.id,
  });
  assert(updatedUser.full_name === 'Kasir Kendal Diperbarui', 'Nama pengguna harus terupdate');
  assert(updatedUser.assigned_store_id === storePegandon!.id, 'Penugasan toko kasir harus pindah ke Pegandon');

  // 5.2 Larangan: Kasir DILARANG ditugaskan ke Gudang Pusat (WH-KENDAL-01)
  let cashierWarehouseDenied = false;
  try {
    await repository.updateUserProfile(targetCashier!.id, {
      assigned_store_id: warehouse!.id,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('Kasir hanya dapat ditugaskan pada toko cabang')) {
      cashierWarehouseDenied = true;
    }
  }
  assert(cashierWarehouseDenied, 'Sistem harus melarang kasir ditugaskan ke Gudang Pusat');

  // 5.3 Reset Password oleh Superadmin
  const resetRes = await repository.resetUserPassword(targetCashier!.id, 'KendalBaru2026!');
  assert(resetRes.success, 'Reset password harus berhasil');
  assert(resetRes.new_password === 'KendalBaru2026!', 'Password baru harus sesuai');

  // Verifikasi audit log reset password
  const auditLogs = await repository.getAuditLogs();
  const resetLog = auditLogs.find((l) => l.action === 'USER_PASSWORD_RESET' && l.entity_id === targetCashier!.id);
  assert(!!resetLog, 'Aktivitas reset password harus tercatat dalam audit log');

  // 5.4 Toggle Status Aktif / Non-Aktif
  const toggledUser = await repository.toggleUserStatus(targetCashier!.id);
  assert(toggledUser.is_active === false, 'Status kasir harus dinonaktifkan');
  const restoredUser = await repository.toggleUserStatus(targetCashier!.id);
  assert(restoredUser.is_active === true, 'Status kasir harus diaktifkan kembali');

  // 5.5 Perlindungan Super Admin Utama: Tidak boleh dinonaktifkan atau dihapus
  const primaryAdmin = initialUsers.find((u) => u.role === 'SUPER_ADMIN');
  assert(!!primaryAdmin, 'Harus ada akun Super Admin');

  let adminDeactivationBlocked = false;
  try {
    await repository.toggleUserStatus(primaryAdmin!.id);
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('super admin utama tidak dapat dinonaktifkan')) {
      adminDeactivationBlocked = true;
    }
  }
  assert(adminDeactivationBlocked, 'Super Admin utama tidak boleh dinonaktifkan');

  let adminDeletionBlocked = false;
  try {
    await repository.deleteUserProfile(primaryAdmin!.id);
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('super admin utama')) {
      adminDeletionBlocked = true;
    }
  }
  assert(adminDeletionBlocked, 'Super Admin utama tidak boleh dihapus');

  console.log('  ✅ Lolos: Edit profil, proteksi gudang bagi kasir, reset password, toggle status, & safeguard Superadmin berhasil.\n');

  console.log('=================================================================');
  console.log('🎉 SEMUA ACCEPTANCE TESTS TAHAP 1 BERHASIL 100%!');
  console.log('=================================================================');
}

runStage1Tests().catch((err) => {
  console.error('❌ Gagal menjalankan test:', err);
  process.exit(1);
});
