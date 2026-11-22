import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan kata sandi wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await repository.verifyUserCredentials(email.trim(), password);

    // Tentukan route tujuan spesifik berdasarkan pos akun (tidak boleh saling tembus)
    let redirectUrl = '/superadmin';
    if (user.role === 'CASHIER') {
      redirectUrl = '/cashier';
    } else if (user.role === 'LOGISTICS') {
      redirectUrl = '/logistics';
    } else if (user.role === 'SUPER_ADMIN') {
      redirectUrl = '/superadmin';
    }

    // Catat audit login
    await repository.createAuditLog({
      action: 'USER_LOGIN_SUCCESS',
      entity_name: 'user_profiles',
      entity_id: user.id,
      new_data: { email: user.email, role: user.role, assigned_store_id: user.assigned_store_id },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        assigned_store_id: user.assigned_store_id,
        assigned_store: user.assigned_store,
      },
      redirectUrl,
    });

    // Set cookie untuk server-side session identification
    response.cookies.set('bb_user_session', JSON.stringify({
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
      assigned_store_id: user.assigned_store_id,
    }), {
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal masuk ke sistem.' },
      { status: 401 }
    );
  }
}
