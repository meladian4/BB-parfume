import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';
import { ProductType } from '@/types/domain';

const ALLOWED_TYPES: ProductType[] = ['BIBIT', 'PELARUT', 'BOTOL', 'READY_TO_WEAR'];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN']);
    const productId = params.id;

    const existing = await repository.getProductById(productId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      sku,
      barcode,
      category_id,
      product_type,
      unit_name,
      base_price,
      min_stock_alert,
      scent_type,
      is_blendable,
      is_active,
    } = body;

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama produk wajib diisi.' },
        { status: 400 }
      );
    }

    const parsedPrice =
      base_price !== undefined && base_price !== '' && base_price !== null
        ? Number(base_price)
        : existing.base_price;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Harga jual harus berupa angka 0 atau lebih.' },
        { status: 400 }
      );
    }

    const parsedMinStock =
      min_stock_alert !== undefined && min_stock_alert !== '' && min_stock_alert !== null
        ? Number(min_stock_alert)
        : existing.min_stock_alert;
    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Minimum stok harus berupa angka 0 atau lebih.' },
        { status: 400 }
      );
    }

    const nextType: ProductType =
      product_type && ALLOWED_TYPES.includes(product_type)
        ? product_type
        : existing.product_type;

    const updated = await repository.updateProduct(productId, {
      name: name !== undefined ? String(name).trim() : existing.name,
      sku: sku !== undefined && String(sku).trim() ? String(sku).trim().toUpperCase() : existing.sku,
      barcode: barcode !== undefined ? (String(barcode).trim() || undefined) : existing.barcode,
      category_id: category_id !== undefined ? (category_id || null) : existing.category_id,
      product_type: nextType,
      unit_name: unit_name !== undefined && String(unit_name).trim() ? String(unit_name).trim() : existing.unit_name,
      base_price: parsedPrice,
      min_stock_alert: parsedMinStock,
      scent_type: scent_type !== undefined ? String(scent_type).trim() : existing.scent_type,
      is_blendable:
        is_blendable !== undefined
          ? Boolean(is_blendable)
          : nextType === 'BIBIT' || nextType === 'PELARUT',
      is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
    });

    await repository.createAuditLog({
      user_id: authUser.id,
      action: 'PRODUCT_UPDATE_API',
      entity_name: 'products',
      entity_id: productId,
      old_data: {
        name: existing.name,
        sku: existing.sku,
        product_type: existing.product_type,
        base_price: existing.base_price,
        min_stock_alert: existing.min_stock_alert,
      },
      new_data: {
        name: updated.name,
        sku: updated.sku,
        product_type: updated.product_type,
        base_price: updated.base_price,
        min_stock_alert: updated.min_stock_alert,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Gagal memperbarui produk.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
