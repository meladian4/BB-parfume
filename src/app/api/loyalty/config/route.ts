import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET() {
  try {
    const config = await db.getLoyaltyConfig();
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat konfigurasi loyalitas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN']);
    const body = await request.json();
    const { spend_per_point, point_value_idr, min_redeem_points, is_active } = body;

    const updated = await db.updateLoyaltyConfig(
      {
        spend_per_point: spend_per_point !== undefined ? Number(spend_per_point) : undefined,
        point_value_idr: point_value_idr !== undefined ? Number(point_value_idr) : undefined,
        min_redeem_points: min_redeem_points !== undefined ? Number(min_redeem_points) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined,
      },
      authUser.id
    );

    return NextResponse.json({ success: true, config: updated });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui konfigurasi.' },
      { status: 400 }
    );
  }
}
