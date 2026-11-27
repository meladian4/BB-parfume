// ============================================================================
// Server-Side Authorization Guards & Store Scoping
// BB Parfum Premium Management System
// ============================================================================

import { UserRole, UserProfile } from '@/types/domain';

export interface AuthContext {
  user: UserProfile;
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class StoreAccessError extends Error {
  constructor(message: string = 'Akses ditolak: Anda tidak diizinkan mengakses toko ini.') {
    super(message);
    this.name = 'StoreAccessError';
  }
}

export class ShiftClosedError extends Error {
  constructor(
    message: string = 'SHIFT BELUM DIBUKA: Kasir wajib membuka shift terlebih dahulu di menu Shift Kasir (Kas) sebelum melakukan transaksi. Saat shift tertutup, kasir hanya dapat melakukan Setor Kas ke Pusat.'
  ) {
    super(message);
    this.name = 'ShiftClosedError';
  }
}

/**
 * Validasi apakah user memiliki salah satu dari role yang diizinkan
 */
export function requireRole(user: UserProfile | null | undefined, allowedRoles: UserRole[]): UserProfile {
  if (!user || !user.is_active) {
    throw new AuthorizationError('Sesi tidak valid atau akun dinonaktifkan.');
  }

  if (user.role !== 'SUPER_ADMIN' && user.is_locked) {
    throw new AuthorizationError('Akses ditolak: Akun Anda sedang terkunci karena 3 kali salah password. Hubungi Super Admin.');
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      `Role '${user.role}' tidak memiliki izin untuk mengakses resource ini. Dibutuhkan salah satu dari: [${allowedRoles.join(', ')}]`
    );
  }

  return user;
}

/**
 * Validasi hak akses lokasi cabang:
 * - SUPER_ADMIN: dapat mengakses semua toko dan gudang
 * - LOGISTICS: dapat mengakses gudang dan toko dalam konteks mutasi/persediaan
 * - CASHIER: HANYA BOLEH mengakses assigned_store_id miliknya
 */
export function validateStoreAccess(
  user: UserProfile,
  targetStoreId: string,
  options?: { allowWarehouseForLogisticsOnly?: boolean }
): void {
  if (user.role === 'SUPER_ADMIN') {
    return; // Super admin possesses universal store access
  }

  if (user.role === 'LOGISTICS') {
    // Logistics can operate globally for stock & transfers, but cannot operate cashier POS
    return;
  }

  if (user.role === 'CASHIER') {
    if (!user.assigned_store_id) {
      throw new StoreAccessError('Kasir belum ditugaskan ke cabang toko manapun.');
    }
    if (user.assigned_store_id !== targetStoreId) {
      throw new StoreAccessError(
        `Kasir hanya dapat mengakses toko cabang yang ditugaskan (${user.assigned_store_id}), bukan toko (${targetStoreId}).`
      );
    }
  }
}

/**
 * Menentukan toko aktif yang sah untuk user:
 * Jika user adalah CASHIER, selalu kunci ke assigned_store_id (abaikan request param).
 * Jika user adalah SUPER_ADMIN atau LOGISTICS, izinkan targetStoreId yang diminta (atau default ke assigned/all).
 */
export function resolveEffectiveStoreId(user: UserProfile, requestedStoreId?: string | null): string | null {
  if (user.role === 'CASHIER') {
    if (!user.assigned_store_id) {
      throw new StoreAccessError('Kasir tidak memiliki cabang yang ditugaskan.');
    }
    // Strict enforcement: Cashier is locked to assigned_store_id regardless of client params
    return user.assigned_store_id;
  }

  return requestedStoreId || user.assigned_store_id || 'a0000000-0000-0000-0000-000000000002';
}

/**
 * Mendapatkan user aktif (sesi kasir / logistik / admin)
 * Pada HTTP request nyata: WAJIB memiliki cookie sesi bertanda tangan (HMAC-SHA256) yang valid.
 * Fallback hanya diizinkan saat berjalan di CLI acceptance test (tanpa Next.js request context).
 */
export async function getSessionUser(roleHint: UserRole = 'CASHIER'): Promise<UserProfile> {
  const { repository } = await import('@/lib/db/repository');
  const { verifySessionToken } = await import('@/lib/auth/crypto');

  let cookieStore: Awaited<ReturnType<(typeof import('next/headers'))['cookies']>> | null = null;
  try {
    const { cookies } = await import('next/headers');
    cookieStore = await cookies();
  } catch {
    // Berjalan di luar Next.js HTTP request context (misal CLI test scripts)
    cookieStore = null;
  }

  if (cookieStore) {
    const rawCookie = cookieStore.get('bb_user_session')?.value;
    const verified = verifySessionToken(rawCookie);
    if (!verified) {
      throw new AuthorizationError('Sesi tidak valid atau telah berakhir. Silakan login kembali.');
    }

    const user = await repository.getUserProfileById(verified.userId || verified.id);
    if (!user || !user.is_active) {
      throw new AuthorizationError('Sesi tidak valid atau akun dinonaktifkan.');
    }
    if (user.role !== 'SUPER_ADMIN' && user.is_locked) {
      throw new AuthorizationError('Akses ditolak: Akun Anda sedang terkunci. Hubungi Super Admin.');
    }
    return user;
  }

  // Hanya untuk skrip test CLI (bukan HTTP request)
  const isTestContext =
    process.env.NODE_ENV === 'test' ||
    process.env.IS_ACCEPTANCE_TEST === 'true' ||
    (typeof process !== 'undefined' && process.argv?.some((a) => a.includes('tests/')));

  if (!isTestContext) {
    throw new AuthorizationError('Sesi tidak ditemukan. Silakan login terlebih dahulu.');
  }

  const users = await repository.getUserProfiles();

  if (roleHint === 'CASHIER') {
    const cashier = users.find((u) => u.role === 'CASHIER' && u.assigned_store_id);
    if (cashier) return cashier;
  }

  if (roleHint === 'LOGISTICS') {
    const log = users.find((u) => u.role === 'LOGISTICS');
    if (log) return log;
  }

  const admin = users.find((u) => u.role === 'SUPER_ADMIN');
  if (admin) return admin;

  return users[0];
}

/**
 * Validasi otorisasi server-side
 */
export async function authenticateAndRequireRole(
  allowedRoles: UserRole[],
  explicitUser?: UserProfile | null
): Promise<UserProfile> {
  const user =
    explicitUser ||
    (await getSessionUser(allowedRoles.includes('CASHIER') ? 'CASHIER' : allowedRoles[0]));
  return requireRole(user, allowedRoles);
}

/**
 * Validasi wajib buka shift khusus role CASHIER sebelum melakukan transaksi apapun
 * (kecuali Setor Kas ke Pusat dan Buka/Tutup Shift).
 * Role SUPER_ADMIN dan LOGISTICS tidak dibatasi oleh shift kasir.
 */
export async function requireOpenShiftForCashier(
  authUser: UserProfile,
  storeId?: string | null
) {
  if (authUser.role !== 'CASHIER') {
    return null;
  }

  const effectiveStoreId = storeId || authUser.assigned_store_id;
  if (!effectiveStoreId) {
    throw new StoreAccessError('Kasir belum ditugaskan ke cabang toko manapun.');
  }

  const { repository } = await import('@/lib/db/repository');
  const activeSession = await repository.getCurrentCashSession(effectiveStoreId, authUser.id);
  if (!activeSession || activeSession.status !== 'OPEN') {
    throw new ShiftClosedError();
  }

  return activeSession;
}

