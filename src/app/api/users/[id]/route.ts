import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';
import { UserRole } from '@/types/domain';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const user = await repository.getUserProfileById(params.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, user, data: user });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Gagal mengambil data pengguna.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const body = await request.json();
    const { full_name, email, role, assigned_store_id, is_active, password, is_locked } = body;

    if (!full_name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Field nama lengkap, email, dan role wajib diisi.' },
        { status: 400 }
      );
    }

    if (!['SUPER_ADMIN', 'LOGISTICS', 'CASHIER'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role hak akses tidak valid.' },
        { status: 400 }
      );
    }

    // LARANGAN POS AKUN:
    // Kasir wajib ditugaskan ke salah satu toko cabang retail dan tidak boleh ke gudang
    if (role === 'CASHIER') {
      if (!assigned_store_id) {
        return NextResponse.json(
          { success: false, error: 'LARANGAN AKSES: Akun kasir wajib dikunci pada salah satu cabang toko retail (Kendal Kota, Pegandon, atau Kaliwungu).' },
          { status: 400 }
        );
      }
      const store = await repository.getStoreById(assigned_store_id);
      if (store && store.type === 'WAREHOUSE') {
        return NextResponse.json(
          { success: false, error: 'LARANGAN AKSES: Akun kasir tidak diizinkan ditugaskan langsung ke Gudang Pusat Distribusi.' },
          { status: 400 }
        );
      }
    }

    const updated = await repository.updateUserProfile(params.id, {
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: role as UserRole,
      assigned_store_id: role === 'SUPER_ADMIN' ? null : assigned_store_id || null,
      is_active: is_active !== undefined ? is_active : true,
      is_locked: is_locked !== undefined ? is_locked : undefined,
      password: password && password.trim() ? password.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Profil, email, dan hak akses pengguna berhasil diperbarui.',
      user: updated,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui pengguna.' },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const body = await request.json();
    const { action, password, email } = body;

    if (action === 'RESET_PASSWORD' || action === 'CHANGE_PASSWORD') {
      const result = await repository.resetUserPassword(params.id, password);
      // Jika email juga ingin diupdate sekaligus
      if (email && email.trim()) {
        await repository.updateUserProfile(params.id, { email: email.trim().toLowerCase() });
      }
      return NextResponse.json({
        success: true,
        message: result.message,
        default_password: result.default_password,
      });
    }

    if (action === 'UNLOCK_ACCOUNT') {
      const updated = await repository.unlockUserAccount(params.id);
      return NextResponse.json({
        success: true,
        message: `Kunci akun ${updated.full_name} berhasil dibuka. Percobaan login gagal telah direset.`,
        user: updated,
        data: updated,
      });
    }

    if (action === 'TOGGLE_STATUS') {
      const updated = await repository.toggleUserStatus(params.id);
      return NextResponse.json({
        success: true,
        message: `Status akun ${updated.full_name} berhasil diubah menjadi ${updated.is_active ? 'AKTIF' : 'NONAKTIF'}.`,
        user: updated,
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: "Action tidak dikenal. Gunakan 'RESET_PASSWORD', 'UNLOCK_ACCOUNT', atau 'TOGGLE_STATUS'." },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memproses aksi pengguna.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    await repository.deleteUserProfile(params.id);
    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil dihapus dari sistem.',
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus pengguna.' },
      { status: 400 }
    );
  }
}
