import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { UserRole } from '@/types/domain';

export async function GET() {
  try {
    const users = await repository.getUserProfiles();
    return NextResponse.json({ success: true, users, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pengguna.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, full_name, role, assigned_store_id, employee_1_name, employee_2_name } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Field email, full_name, dan role wajib diisi.' },
        { status: 400 }
      );
    }

    if (!['SUPER_ADMIN', 'LOGISTICS', 'CASHIER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role tidak valid.' },
        { status: 400 }
      );
    }

    // CASHIER validation
    if (role === 'CASHIER') {
      if (!assigned_store_id) {
        return NextResponse.json(
          { success: false, error: 'LARANGAN AKSES: Kasir wajib dikunci ke salah satu cabang toko retail.' },
          { status: 400 }
        );
      }
      const store = await repository.getStoreById(assigned_store_id);
      if (store && store.type === 'WAREHOUSE') {
        return NextResponse.json(
          { success: false, error: 'LARANGAN AKSES: Akun kasir tidak diizinkan ditugaskan langsung ke Gudang Pusat.' },
          { status: 400 }
        );
      }
    }

    const userId = id || `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const saved = await repository.upsertUserProfile({
      id: userId,
      email: email.trim().toLowerCase(),
      full_name: full_name.trim(),
      role: role as UserRole,
      assigned_store_id: role === 'SUPER_ADMIN' ? null : assigned_store_id,
      employee_1_name: role === 'CASHIER' ? employee_1_name?.trim() || null : null,
      employee_2_name: role === 'CASHIER' ? employee_2_name?.trim() || null : null,
      is_active: true,
    });

    await repository.createAuditLog({
      action: 'USER_UPSERT_API',
      entity_name: 'user_profiles',
      entity_id: saved.id,
      new_data: { email, full_name, role, assigned_store_id },
    });

    return NextResponse.json({ success: true, data: saved }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses pengguna.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
