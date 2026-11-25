import crypto from 'crypto';

// Secret untuk penandatanganan sesi (HMAC-SHA256)
// Disarankan set SESSION_SECRET di .env server; fallback deterministik per-mesin jika belum diset
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'bb-parfum-kendal-secure-session-key-v1-9f4c2a8e7b1d603a';

export interface SignedSessionPayload {
  id: string;
  userId: string;
  email: string;
  role: string;
  assigned_store_id: string | null;
  exp: number; // unix timestamp ms
}

/**
 * Buat token sesi bertanda tangan HMAC-SHA256 (format: base64urlPayload.hexSignature)
 */
export function signSessionToken(payload: Omit<SignedSessionPayload, 'exp'>, ttlSeconds = 60 * 60 * 24 * 7): string {
  const fullPayload: SignedSessionPayload = {
    ...payload,
    exp: Date.now() + ttlSeconds * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

/**
 * Verifikasi token sesi bertanda tangan HMAC-SHA256 menggunakan timingSafeEqual
 * Mengembalikan payload jika valid & belum kadaluarsa, atau null jika dipalsukan/rusak
 */
export function verifySessionToken(token: string | undefined | null): SignedSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('hex');
    const providedBuf = Buffer.from(providedSig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (providedBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SignedSessionPayload;
    if (!decoded || !decoded.id || typeof decoded.exp !== 'number') return null;
    if (Date.now() > decoded.exp) return null;

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Hash kata sandi menggunakan scrypt + random salt 16-byte (built-in Node crypto)
 * Format tersimpan: scrypt$<saltHex>$<hashHex>
 */
export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function isPasswordHashed(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith('scrypt$') && stored.split('$').length === 3;
}

/**
 * Verifikasi kata sandi plain terhadap hash scrypt (atau fallback legacy plain text)
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    const [, salt, storedHex] = stored.split('$');
    if (!salt || !storedHex) return false;
    try {
      const derivedBuf = crypto.scryptSync(plain, salt, 64);
      const storedBuf = Buffer.from(storedHex, 'hex');
      if (derivedBuf.length !== storedBuf.length) return false;
      return crypto.timingSafeEqual(derivedBuf, storedBuf);
    } catch {
      return false;
    }
  }
  // Legacy plain text comparison (timing-safe)
  const a = Buffer.from(plain, 'utf-8');
  const b = Buffer.from(stored, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
