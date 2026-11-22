import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const products = await repository.getProducts({
      search,
      categoryId,
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat produk.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sku,
      barcode,
      name,
      category_id,
      size_ml,
      scent_type,
      top_notes,
      middle_notes,
      base_notes,
      base_price,
      min_stock_alert,
      product_type,
      unit_name,
      is_blendable,
      initial_stock,
      initial_cost,
      initial_store_id,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama produk atau bibit parfum wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await repository.createProduct({
      sku: sku?.trim()?.toUpperCase() || '',
      barcode: barcode?.trim() || null,
      name: name.trim(),
      category_id: category_id || null,
      size_ml: Number(size_ml) || 50,
      scent_type: scent_type || 'Bibit Parfum Murni',
      top_notes: top_notes?.trim() || null,
      middle_notes: middle_notes?.trim() || null,
      base_notes: base_notes?.trim() || null,
      base_price: Number(base_price) || 0,
      min_stock_alert: Number(min_stock_alert) || 5,
      product_type: product_type || 'BIBIT',
      unit_name: unit_name || 'ml',
      is_blendable: is_blendable ?? true,
      is_active: true,
      initial_stock: Number(initial_stock) > 0 ? Number(initial_stock) : undefined,
      initial_cost: Number(initial_cost) >= 0 ? Number(initial_cost) : undefined,
      initial_store_id: initial_store_id || undefined,
    });

    await repository.createAuditLog({
      action: 'PRODUCT_CREATE_API',
      entity_name: 'products',
      entity_id: created.id,
      new_data: { sku, name, base_price },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat produk.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      await repository.clearAllProducts();
      return NextResponse.json({ success: true, message: 'Seluruh produk & persediaan berhasil dikosongkan.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parameter id produk wajib disertakan.' }, { status: 400 });
    }

    await repository.deleteProduct(id);
    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus produk.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
