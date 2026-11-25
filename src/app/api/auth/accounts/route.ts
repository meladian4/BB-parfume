import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await repository.getUsers();
    const roleOrder: Record<string, number> = {
      SUPER_ADMIN: 1,
      LOGISTICS: 2,
      CASHIER: 3,
    };

    const accounts = users
      .filter((u) => u.is_active !== false)
      .sort((a, b) => (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99))
      .map((u) => ({
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        store_name: u.assigned_store?.name || null,
      }));

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, accounts: [], error: error.message || 'Gagal memuat daftar akun.' },
      { status: 500 }
    );
  }
}
