// ============================================================================
// Formatting Utilities: Indonesian Rupiah (IDR) & Asia/Jakarta Timezone
// BB Parfum Premium Management System
// ============================================================================

/**
 * Format numeric value to Indonesian Rupiah (IDR) currency string.
 * Example: 185000 -> "Rp 185.000"
 */
export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Date to Asia/Jakarta (WIB) timezone string
 * Example: 2026-10-11T12:00:00Z -> "11 Okt 2026, 19:00 WIB"
 */
export function formatDateTimeJakarta(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';

  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date) + ' WIB'
  );
}

/**
 * Format Date only (Asia/Jakarta)
 * Example: "11 Oktober 2026"
 */
export function formatDateJakarta(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Format Time only (Asia/Jakarta)
 * Example: "12:45 WIB"
 */
export function formatTimeJakarta(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';

  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date) + ' WIB'
  );
}
