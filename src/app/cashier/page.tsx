'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Product,
  Store,
  UserProfile,
  CashSession,
  Member,
  PaymentMethod,
  Sale,
  StockTransfer,
  PerfumeTier,
} from '@/types/domain';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  UserCheck,
  UserPlus,
  DollarSign,
  QrCode,
  CreditCard,
  Building2,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Package,
  FlaskConical,
  Beaker,
  Droplet,
  Wine,
  Info,
  Edit3,
  Truck,
  X,
  ArrowRight,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  discount_amount: number;
  custom_price?: number;
  custom_name?: string;
}

export default function CashierPOSPage() {
  const router = useRouter();

  // State User & Cabang Kasir
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const u = localStorage.getItem('bb_current_user');
        if (u) return JSON.parse(u);
      } catch {}
    }
    return null;
  });
  const [store, setStore] = useState<Store | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = localStorage.getItem('bb_pos_store_cache');
        if (s) return JSON.parse(s);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bb_pos_products_cache');
        if (cached && JSON.parse(cached).length > 0) return false;
      } catch {}
    }
    return true;
  });
  const [incomingTransfersCount, setIncomingTransfersCount] = useState<number>(0);

  // State Sesi Kasir
  const [session, setSession] = useState<CashSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = localStorage.getItem('bb_pos_session_cache');
        if (s) return JSON.parse(s);
      } catch {}
    }
    return null;
  });
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionAction, setSessionAction] = useState<'OPEN' | 'CLOSE'>('OPEN');
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [openingCashInput, setOpeningCashInput] = useState<string>('0');
  const [closingCashInput, setClosingCashInput] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionSubmitting, setSessionSubmitting] = useState(false);

  // State Katalog Produk & Stok Toko (Instant Cache-First)
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bb_pos_products_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bb_pos_inventory_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return {};
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // State Keranjang POS
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PerfumeTier>('Standard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState<string>('0');
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // State Modal Pembayaran
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [payReference, setPayReference] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // State Invoice Sukses & Dialog Cetak Struk
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptPaperSize, setReceiptPaperSize] = useState<'58mm' | '80mm'>('58mm');

  // State Modal Racik / Campur Bibit (Custom Blend)
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);
  const [blendBottleSize, setBlendBottleSize] = useState<number>(30);
  const [blendBibit1Id, setBlendBibit1Id] = useState<string>('');
  const [blendBibit1Ml, setBlendBibit1Ml] = useState<number>(15);
  const [blendBibit2Id, setBlendBibit2Id] = useState<string>('');
  const [blendBibit2Ml, setBlendBibit2Ml] = useState<number>(15);
  const [blendPelarutId, setBlendPelarutId] = useState<string>('');
  const [blendPelarutMl, setBlendPelarutMl] = useState<number>(0);
  const [blendBottleId, setBlendBottleId] = useState<string>('');
  const [blendCustomPrice, setBlendCustomPrice] = useState<string>('');
  const [blendCustomName, setBlendCustomName] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. Inisialisasi Data User & Sesi secara Paralel (Ultra Fast / Instant Load)
  const loadInitialData = async (isSilent = false) => {
    try {
      if (!isSilent && products.length === 0) {
        setLoading(true);
      }

      // Jalankan seluruh fetch data independen secara paralel
      const [uRes, sessRes, cfgRes, trRes, prodRes]: any[] = await Promise.all([
        fetch('/api/users/me').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
        fetch('/api/pos/session').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
        fetch('/api/loyalty/config').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
        fetch('/api/transfers').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
        fetch('/api/products').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      ]);

      const activeUser = uRes?.user || null;
      if (activeUser) {
        setUser(activeUser);
        try {
          localStorage.setItem('bb_current_user', JSON.stringify(activeUser));
        } catch {}
      }

      let storeId = activeUser?.assigned_store_id;

      // Ambil detail cabang kasir
      if (storeId) {
        fetch(`/api/stores/${storeId}`)
          .then((r) => r.json())
          .then((sData) => {
            if (sData?.store) {
              setStore(sData.store);
              try {
                localStorage.setItem('bb_pos_store_cache', JSON.stringify(sData.store));
              } catch {}
            }
          })
          .catch(() => {});
      } else {
        fetch('/api/stores')
          .then((r) => r.json())
          .then((storesData) => {
            const list = storesData.stores || storesData.data || [];
            const defaultStore = list.find((s: any) => s.type === 'STORE') || list[0];
            if (defaultStore) {
              setStore(defaultStore);
              try {
                localStorage.setItem('bb_pos_store_cache', JSON.stringify(defaultStore));
              } catch {}
            }
          })
          .catch(() => {});
      }

      // Sesi kasir
      if (sessRes) {
        setSession(sessRes.session || null);
        try {
          if (sessRes.session) {
            localStorage.setItem('bb_pos_session_cache', JSON.stringify(sessRes.session));
          } else {
            localStorage.removeItem('bb_pos_session_cache');
          }
        } catch {}

        if (typeof sessRes.available_cash === 'number') {
          setAvailableCash(sessRes.available_cash);
          if (!sessRes.session) {
            setOpeningCashInput(sessRes.available_cash.toString());
          }
        }
      }

      // Loyalty Config
      if (cfgRes?.config) setLoyaltyConfig(cfgRes.config);

      // Mutasi Masuk
      const trList: StockTransfer[] = trRes?.data || trRes?.transfers || [];
      const inTransitForStore = trList.filter(
        (t) => t.status === 'IN_TRANSIT' && (!storeId || t.destination_store_id === storeId)
      );
      setIncomingTransfersCount(inTransitForStore.length);

      // Produk Master
      const prodList = prodRes?.data || prodRes?.products || [];
      if (Array.isArray(prodList) && prodList.length > 0) {
        const activeProds = prodList.filter((p: Product) => p.is_active);
        setProducts(activeProds);
        try {
          localStorage.setItem('bb_pos_products_cache', JSON.stringify(activeProds));
        } catch {}
      }

      // Stok Inventaris Cabang Kasir
      const invUrl = storeId ? `/api/inventory?storeId=${storeId}` : '/api/inventory';
      const invData: any = await fetch(invUrl).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
      const balList = invData?.data || invData?.balances || [];
      if (Array.isArray(balList)) {
        const map: Record<string, number> = {};
        for (const bal of balList) {
          map[bal.product_id] = bal.quantity;
        }
        setInventoryMap(map);
        try {
          localStorage.setItem('bb_pos_inventory_cache', JSON.stringify(map));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load initial POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter Sub-List untuk Racik Parfum (Hanya yang memiliki stok di cabang ini)
  const bibitProducts = useMemo(() => {
    return products.filter((p) => (p.product_type === 'BIBIT' || p.is_blendable) && (inventoryMap[p.id] ?? 0) > 0);
  }, [products, inventoryMap]);

  const pelarutProducts = useMemo(() => {
    return products.filter((p) => p.product_type === 'PELARUT' && (inventoryMap[p.id] ?? 0) > 0);
  }, [products, inventoryMap]);

  const botolProducts = useMemo(() => {
    return products.filter((p) => p.product_type === 'BOTOL' && (inventoryMap[p.id] ?? 0) > 0);
  }, [products, inventoryMap]);

  // 2. Filter Produk (Hanya tampilkan produk yang stoknya > 0 di cabang ini, jangan tampilkan produk kosong)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = inventoryMap[p.id] ?? 0;
      if (stock <= 0) return false;

      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.scent_type && p.scent_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'ALL' ||
        p.product_type === selectedCategory ||
        p.category_id === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory, inventoryMap]);

  // Handle Barcode Scan Enter
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const exactMatch = products.find(
        (p) =>
          p.barcode === searchQuery.trim() ||
          p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  };

  // 3. Logika Keranjang & Transaksi Manual
  const addToCart = (product: Product, qtyToAdd = 1, customPrice?: number, customName?: string) => {
    const stockAvailable = inventoryMap[product.id] || 0;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const unit = product.unit_name || (product.product_type === 'BIBIT' ? 'ml' : 'botol');

    if (currentQtyInCart + qtyToAdd > stockAvailable) {
      alert(`Stok "${product.name}" tidak mencukupi di cabang ini (Tersedia: ${stockAvailable} ${unit}, Diminta: ${currentQtyInCart + qtyToAdd} ${unit}).`);
      return;
    }

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += qtyToAdd;
      if (customPrice !== undefined) updated[existingIndex].custom_price = customPrice;
      if (customName) updated[existingIndex].custom_name = customName;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: qtyToAdd,
          discount_amount: 0,
          custom_price: customPrice,
          custom_name: customName,
        },
      ]);
    }
  };

  const updateItemCustomPrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, custom_price: Math.max(0, newPrice) } : it))
    );
  };

  const setExactQuantity = (productId: string, exactQty: number) => {
    const stockAvailable = inventoryMap[productId] || 0;
    const item = cart.find((c) => c.product.id === productId);
    const unit = item?.product.unit_name || (item?.product.product_type === 'BIBIT' ? 'ml' : 'botol');

    if (exactQty > stockAvailable) {
      alert(`Stok maksimal yang tersedia di cabang ini adalah ${stockAvailable} ${unit}.`);
      return;
    }
    if (exactQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: exactQty } : it))
    );
  };

  const handleQuantityInputChange = (productId: string, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    const num = clean === '' ? 0 : parseInt(clean, 10);
    const stockAvailable = inventoryMap[productId] || 9999;
    const item = cart.find((c) => c.product.id === productId);
    const unit = item?.product.unit_name || (item?.product.product_type === 'BIBIT' ? 'ml' : 'botol');

    if (num > stockAvailable) {
      alert(`Stok maksimal yang tersedia di cabang ini adalah ${stockAvailable} ${unit}.`);
      return;
    }

    setCart((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, quantity: num } : it))
    );
  };

  const handleQuantityInputBlur = (productId: string) => {
    setCart((prev) =>
      prev.map((it) => {
        if (it.product.id === productId) {
          return { ...it, quantity: it.quantity <= 0 ? 1 : it.quantity };
        }
        return it;
      })
    );
  };

  const updateQuantity = (productId: string, delta: number) => {
    const stockAvailable = inventoryMap[productId] || 0;
    const item = cart.find((c) => c.product.id === productId);
    const unit = item?.product.unit_name || (item?.product.product_type === 'BIBIT' ? 'ml' : 'botol');

    setCart((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            if (nextQty > stockAvailable) {
              alert(`Stok maksimal yang tersedia adalah ${stockAvailable} ${unit}.`);
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
      );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Logika Racik / Campur Bibit Parfum (Custom Blend)
  const handleAddBlendToCart = (e: React.FormEvent) => {
    e.preventDefault();

    const bibit1 = products.find((p) => p.id === blendBibit1Id);
    if (!bibit1) {
      alert('Pilih minimal 1 Bibit Parfum utama.');
      return;
    }

    const bibit2 = blendBibit2Id ? products.find((p) => p.id === blendBibit2Id) : null;
    const pelarut = blendPelarutId ? products.find((p) => p.id === blendPelarutId) : null;
    const botol = blendBottleId ? products.find((p) => p.id === blendBottleId) : null;

    // Check stocks
    const stock1 = inventoryMap[bibit1.id] || 0;
    if (blendBibit1Ml > stock1) {
      alert(`Stok Bibit 1 "${bibit1.name}" tidak cukup. Tersedia: ${stock1} ml, diminta: ${blendBibit1Ml} ml.`);
      return;
    }

    if (bibit2 && blendBibit2Ml > 0) {
      const stock2 = inventoryMap[bibit2.id] || 0;
      if (blendBibit2Ml > stock2) {
        alert(`Stok Bibit 2 "${bibit2.name}" tidak cukup. Tersedia: ${stock2} ml, diminta: ${blendBibit2Ml} ml.`);
        return;
      }
    }

    if (pelarut && blendPelarutMl > 0) {
      const stockP = inventoryMap[pelarut.id] || 0;
      if (blendPelarutMl > stockP) {
        alert(`Stok Pelarut "${pelarut.name}" tidak cukup. Tersedia: ${stockP} ml, diminta: ${blendPelarutMl} ml.`);
        return;
      }
    }

    if (botol) {
      const stockB = inventoryMap[botol.id] || 0;
      if (stockB < 1) {
        alert(`Stok Botol "${botol.name}" tidak cukup. Tersedia: ${stockB} pcs.`);
        return;
      }
    }

    const customPriceNum = blendCustomPrice.trim() !== '' ? Number(blendCustomPrice) : undefined;
    const blendLabel = blendCustomName.trim() || `Racikan ${bibit1.name} ${blendBottleSize}ml`;

    if (customPriceNum !== undefined && customPriceNum >= 0) {
      // Harga paket manual yang ditentukan kasir
      addToCart(bibit1, blendBibit1Ml, customPriceNum, blendLabel);
      if (bibit2 && blendBibit2Ml > 0) {
        addToCart(bibit2, blendBibit2Ml, 0, `Campuran: ${bibit2.name} (Termasuk Paket)`);
      }
      if (pelarut && blendPelarutMl > 0) {
        addToCart(pelarut, blendPelarutMl, 0, `Pelarut: ${pelarut.name} (Termasuk Paket)`);
      }
      if (botol) {
        addToCart(botol, 1, 0, `Botol: ${botol.name} (Termasuk Paket)`);
      }
    } else {
      addToCart(bibit1, blendBibit1Ml, undefined, blendLabel);
      if (bibit2 && blendBibit2Ml > 0) {
        addToCart(bibit2, blendBibit2Ml);
      }
      if (pelarut && blendPelarutMl > 0) {
        addToCart(pelarut, blendPelarutMl);
      }
      if (botol) {
        addToCart(botol, 1);
      }
    }

    setIsBlendModalOpen(false);
    setBlendCustomPrice('');
    setBlendCustomName('');
  };

  // 4. Kalkulasi Nilai Belanja
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.custom_price !== undefined ? item.custom_price : item.product.base_price;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.discount_amount || 0), 0);
  }, [cart]);

  const pointsToRedeemNumber = Number(pointsToRedeemInput) || 0;
  const pointDiscount = useMemo(() => {
    if (!loyaltyConfig || pointsToRedeemNumber <= 0 || !selectedMember) return 0;
    return pointsToRedeemNumber * (loyaltyConfig.point_value_idr || 0);
  }, [loyaltyConfig, pointsToRedeemNumber, selectedMember]);

  const finalAmount = Math.max(0, subtotal - totalDiscount - pointDiscount);

  // Quick Cash Buttons
  const cashAmountNumber = Number(cashAmountInput) || 0;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, cashAmountNumber - finalAmount) : 0;

  // 5. Buka / Tutup Sesi Kasir
  const handleSessionSubmit = async () => {
    try {
      setSessionSubmitting(true);
      if (sessionAction === 'OPEN') {
        const res = await fetch('/api/pos/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'OPEN',
            opening_cash: Number(openingCashInput) || 0,
            notes: sessionNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSession(data.session);
        setIsSessionModalOpen(false);
      } else {
        if (!session) return;
        const res = await fetch('/api/pos/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CLOSE',
            session_id: session.id,
            actual_cash: Number(closingCashInput) || 0,
            notes: sessionNotes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSession(null);
        setIsSessionModalOpen(false);
        alert('Sesi kasir berhasil ditutup dan kas telah direkonsiliasi.');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses sesi kasir.');
    } finally {
      setSessionSubmitting(false);
    }
  };

  // 6. Pencarian & Registrasi Member
  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    try {
      const res = await fetch(`/api/members?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMembersList(data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberName,
          phone: newMemberPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedMember(data.member);
      setIsMemberModalOpen(false);
      setNewMemberName('');
      setNewMemberPhone('');
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan member.');
    }
  };

  // 7. Eksekusi Checkout
  const handleOpenPayment = () => {
    if (!session || session.status !== 'OPEN') {
      alert('Buka sesi kasir terlebih dahulu sebelum melayani transaksi.');
      setSessionAction('OPEN');
      setIsSessionModalOpen(true);
      return;
    }
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong.');
      return;
    }
    const invalidItem = cart.find((it) => it.quantity <= 0);
    if (invalidItem) {
      alert(`Kuantitas untuk "${invalidItem.product.name}" harus lebih dari 0.`);
      return;
    }
    setCashAmountInput(finalAmount.toString());
    setCheckoutError(null);
    setIsPayModalOpen(true);
  };

  const handleProcessCheckout = async () => {
    try {
      setCheckoutSubmitting(true);
      setCheckoutError(null);

      // Generate UUIDv4 idempotency key
      const idempotencyKey = `pos-${store?.code || 'KDL'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const payload = {
        cash_session_id: session?.id,
        member_id: selectedMember?.id,
        idempotency_key: idempotencyKey,
        perfume_tier: selectedTier,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.custom_price !== undefined ? item.custom_price : item.product.base_price,
          discount_amount: item.discount_amount || 0,
        })),
        points_to_redeem: pointsToRedeemNumber > 0 ? pointsToRedeemNumber : undefined,
        payment: {
          payment_method: paymentMethod,
          amount: paymentMethod === 'CASH' ? Number(cashAmountInput) || 0 : finalAmount,
          payment_reference: payReference || undefined,
        },
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Checkout gagal.');
      }

      // Transaksi Berhasil
      setCompletedSale(data.sale);
      setIsPayModalOpen(false);
      setIsReceiptModalOpen(true);

      // Reset Keranjang
      setCart([]);
      setSelectedMember(null);
      setPointsToRedeemInput('0');
      setPayReference('');

      // Refresh Sesi & Stok secara Senyap (Tanpa Menampilkan Layar Loading)
      loadInitialData(true);
    } catch (err: any) {
      setCheckoutError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={user?.role || 'CASHIER'} />

        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-[#090D16] to-[#04060A]">
          {/* TOP POS HEADER BAR (Responsive for Phone & Desktop) */}
          <div className="p-2.5 sm:p-4 border-b border-[#1E293B] bg-[#0B101D]/90 backdrop-blur flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BBLogo variant="gold" size="xs" withContainer />
                <div>
                  <h1 className="text-xs sm:text-base font-bold text-white flex items-center gap-1.5">
                    POS Kasir
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#E5C365] border border-[#D4AF37]/30 font-medium truncate max-w-[130px] sm:max-w-none">
                      {store?.name?.replace('BB Parfum Toko ', 'Toko ') || 'Cabang Kendal'}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Tombol Keranjang Cepat di Header Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="lg:hidden relative px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-bold flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                {cart.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </div>

            {/* Sesi Kasir Status Button & Notifikasi Mutasi */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
              <a
                href="/cashier/expenses"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-[#D4AF37] transition text-[11px] font-semibold whitespace-nowrap"
                title="Catat beban atau pengeluaran operasional kas toko cabang"
              >
                <DollarSign className="w-3 h-3 text-[#D4AF37]" />
                <span>Beban Toko</span>
              </a>

              {incomingTransfersCount > 0 && (
                <a
                  href="/cashier/transfers"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 transition text-[11px] font-semibold whitespace-nowrap"
                  title="Ada kiriman barang mutasi dari gudang yang siap diterima"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>{incomingTransfersCount} Kiriman</span>
                </a>
              )}

              {session && session.status === 'OPEN' ? (
                <div className="flex items-center gap-1.5 bg-[#0F172A] border border-emerald-500/30 rounded-lg px-2.5 py-1 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div className="text-left text-[11px]">
                    <span className="text-slate-400">Shift Aktif</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessionAction('CLOSE');
                      setClosingCashInput(availableCash.toString());
                      setIsSessionModalOpen(true);
                    }}
                    className="ml-1 text-[11px] text-rose-400 hover:text-rose-300 py-0.5 px-1.5 h-auto"
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    Tutup
                  </Button>
                </div>
              ) : (
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => {
                    setSessionAction('OPEN');
                    setOpeningCashInput(availableCash.toString());
                    setIsSessionModalOpen(true);
                  }}
                  className="shadow-lg shadow-[#D4AF37]/20 text-[11px] py-1 px-2.5 h-auto whitespace-nowrap"
                >
                  <Unlock className="w-3.5 h-3.5 mr-1" />
                  Buka Kasir
                </Button>
              )}
            </div>
          </div>

          {/* MAIN BODY: 2 COLUMNS (CATALOG & CART) */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* LEFT: PRODUCT CATALOG & SCANNER */}
            <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 pb-28 lg:pb-4">
              {/* Search & Category Tabs */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      if (bibitProducts.length > 0 && !blendBibit1Id) {
                        setBlendBibit1Id(bibitProducts[0].id);
                      }
                      setIsBlendModalOpen(true);
                    }}
                    className="whitespace-nowrap shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>🧪 Racik / Campur Bibit</span>
                  </Button>
                </div>

                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan Barcode / Ketik SKU / Nama Parfum (Tekan Enter)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-colors"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {[
                    { id: 'ALL', label: 'Semua Produk' },
                    { id: 'BIBIT', label: '🌿 Bibit Parfum' },
                    { id: 'PELARUT', label: '💧 Pelarut / Campuran' },
                    { id: 'BOTOL', label: '🍾 Botol Kemasan' },
                    { id: 'READY_TO_WEAR', label: '✨ Siap Pakai' },
                  ].map((tab) => {
                    const active = selectedCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedCategory(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                          active
                            ? 'bg-[#D4AF37] text-black font-semibold'
                            : 'bg-[#0F172A] text-slate-400 hover:text-white border border-[#1E293B]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
                {filteredProducts.map((p) => {
                  const stock = inventoryMap[p.id] ?? 0;
                  const unit = p.unit_name || (p.product_type === 'BIBIT' ? 'ml' : 'botol');

                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p, p.product_type === 'BIBIT' ? 10 : 1)}
                      className="group relative rounded-2xl border transition-all text-left p-2.5 sm:p-3.5 flex flex-col justify-between select-none bg-gradient-to-b from-[#0F172A] to-[#0A0E1A] border-[#1E293B] hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/5 cursor-pointer active:scale-[0.98]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                              stock > 10
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            Stok: {stock} {unit}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-1">
                          {p.product_type === 'BIBIT' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#E5C365] font-semibold">
                              🌿 Bibit
                            </span>
                          ) : p.product_type === 'PELARUT' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-semibold">
                              💧 Pelarut
                            </span>
                          ) : p.product_type === 'BOTOL' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
                              🍾 Botol
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold">
                              ✨ Siap Pakai
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-[#E5C365] transition-colors line-clamp-1">
                          {p.name}
                        </h3>

                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          {p.top_notes || p.scent_type || 'Aroma Mewah'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1E293B]/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400">
                              {p.product_type === 'BIBIT' ? 'Per ml' : `${p.size_ml} ml`}
                            </p>
                            <p className="text-sm font-bold text-[#D4AF37]">
                              {formatIDR(p.base_price)}
                              <span className="text-[10px] text-slate-400 font-normal ml-0.5">/{unit}</span>
                            </p>
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/10 group-hover:bg-[#D4AF37] text-[#D4AF37] group-hover:text-black flex items-center justify-center transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SKELETON SHIMMER PLACEHOLDER SAAT LOADING COLD PERTAMA KALI */}
              {loading && filteredProducts.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-14 bg-slate-800 rounded" />
                        <div className="h-3 w-10 bg-slate-800 rounded" />
                      </div>
                      <div className="h-4 w-3/4 bg-slate-800 rounded" />
                      <div className="h-2.5 w-1/2 bg-slate-800/60 rounded" />
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                        <div className="h-4 w-16 bg-slate-800 rounded" />
                        <div className="w-7 h-7 bg-slate-800 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* KONDISI JIKA BENAR-BENAR KOSONG SETELAH SELESAI LOADING */}
              {!loading && filteredProducts.length === 0 && (
                <div className="text-center py-20 px-4 text-slate-500 space-y-2">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#D4AF37]" />
                  <p className="text-sm font-bold text-slate-200">
                    {searchQuery
                      ? 'Tidak ada produk yang cocok dengan pencarian.'
                      : 'Belum Ada Stok Barang Tersedia di Cabang Ini'}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {searchQuery
                      ? 'Coba ubah kata kunci pencarian.'
                      : 'Seluruh stok produk di cabang ini masih kosong (0). Produk fisik akan otomatis tampil aktif di kasir setelah toko menerima kiriman mutasi dari Gudang Pusat.'}
                  </p>
                  {!searchQuery && (
                    <div className="pt-3">
                      <a
                        href="/cashier/transfers"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold transition shadow-sm"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Cek Penerimaan Mutasi Barang Dari Gudang &rarr;</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BACKDROP UNTUK MOBILE CART DRAWER */}
            {isMobileCartOpen && (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
                onClick={() => setIsMobileCartOpen(false)}
              />
            )}

            {/* RIGHT: SHOPPING CART & BILLING PANEL (Drawer di Mobile, Side Panel di Desktop) */}
            <div
              className={`
                fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] lg:static lg:z-auto lg:w-96
                border-l border-[#1E293B] bg-[#0A0E1A] flex flex-col justify-between shrink-0 shadow-2xl
                transition-transform duration-300 ease-in-out
                ${isMobileCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
              `}
            >
              {/* Cart Header */}
              <div className="p-4 border-b border-[#1E293B] bg-[#0D1220] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileCartOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
                    title="Tutup Keranjang"
                    aria-label="Tutup Keranjang"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <ShoppingCart className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-bold text-white">Keranjang Belanja</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} item
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Member Selector Strip */}
              <div className="px-4 py-2.5 border-b border-[#1E293B] bg-[#0F172A]/50 flex flex-col gap-2">
                {selectedMember ? (
                  <>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">{selectedMember.name}</p>
                          <p className="text-[10px] text-slate-400">{selectedMember.phone} • {selectedMember.points_balance} Poin ({selectedMember.tier})</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMember(null);
                          setPointsToRedeemInput('0');
                        }}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        Batal
                      </button>
                    </div>

                    {/* Reward Policy Info & Estimated Earning */}
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between text-emerald-300 font-semibold">
                        <span>Reward Belanja Member:</span>
                        <span>Rp 1.500 per kelipatan Rp 30.000</span>
                      </div>
                      {finalAmount > 0 && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Potensi Poin Transaksi Ini:</span>
                          <span className="font-bold text-[#E5C365]">
                            +{Math.floor(finalAmount / (loyaltyConfig?.spend_per_point || 30000))} Poin (+{formatIDR(Math.floor(finalAmount / (loyaltyConfig?.spend_per_point || 30000)) * (loyaltyConfig?.point_value_idr || 1500))})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Point Redemption Subpanel */}
                    {selectedMember.points_balance >= (loyaltyConfig?.min_redeem_points || 1) && (
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-300 font-semibold">Tukar Poin Diskon:</span>
                          <span className="text-[#D4AF37]">
                            Maks: {selectedMember.points_balance} pts ({formatIDR(selectedMember.points_balance * (loyaltyConfig?.point_value_idr || 1500))})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max={selectedMember.points_balance}
                            value={pointsToRedeemInput}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(selectedMember.points_balance, Number(e.target.value) || 0));
                              setPointsToRedeemInput(val.toString());
                            }}
                            className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-[#D4AF37] font-bold text-center"
                          />
                          <span className="text-[10px] text-slate-400">pts (1 pts = {formatIDR(loyaltyConfig?.point_value_idr || 1500)})</span>
                          {pointDiscount > 0 && (
                            <span className="text-xs font-bold text-emerald-400 ml-auto">
                              -{formatIDR(pointDiscount)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      searchMembers('');
                      setIsMemberModalOpen(true);
                    }}
                    className="w-full py-1 text-xs text-[#D4AF37] hover:text-[#E5C365] flex items-center justify-center gap-1.5 font-medium transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Pilih / Daftar Member Loyalty
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map((item) => {
                  const unit = item.product.unit_name || (item.product.product_type === 'BIBIT' ? 'ml' : 'btl');
                  const unitPrice = item.custom_price !== undefined ? item.custom_price : item.product.base_price;
                  const itemSubtotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-slate-100 truncate">
                              {item.custom_name || item.product.name}
                            </span>
                            {item.custom_name && item.custom_name !== item.product.name && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#E5C365] font-semibold border border-[#D4AF37]/30">
                                Custom
                              </span>
                            )}
                            {item.product.product_type === 'BIBIT' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/15 text-[#E5C365] font-semibold border border-[#D4AF37]/25">
                                Bibit
                              </span>
                            )}
                            {item.product.product_type === 'PELARUT' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/25">
                                Pelarut
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-[#E5C365]">
                              {formatIDR(itemSubtotal)}
                            </span>
                            {item.custom_price !== undefined && (
                              <span className="text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                Harga Manual
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Hapus dari keranjang"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Manual Editable Controls: Quantity & Custom Unit Price */}
                      <div className="pt-1.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                        {/* Quantity Stepper with Direct Number Input */}
                        <div className="flex items-center gap-1 bg-[#090D16] border border-[#1E293B] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.product.product_type === 'BIBIT' && item.quantity > 5 ? -5 : -1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={item.product.product_type === 'BIBIT' ? '-5 ml' : '-1'}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.quantity === 0 ? '' : item.quantity}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleQuantityInputChange(item.product.id, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(item.product.id)}
                            className="w-12 bg-transparent text-center font-bold text-xs text-white focus:outline-none focus:bg-slate-800 rounded px-0.5 selection:bg-[#D4AF37] selection:text-black"
                            title="Klik untuk ketik manual / hapus angka"
                          />
                          <span className="text-[10px] text-slate-400 pr-1">
                            {unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.product.product_type === 'BIBIT' ? 5 : 1)}
                            className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title={item.product.product_type === 'BIBIT' ? '+5 ml' : '+1'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Direct Manual Price Input */}
                        <div className="flex items-center gap-1 bg-[#090D16] border border-[#1E293B] rounded-lg px-2 py-0.5" title="Ketik manual harga satuan item jika ada kesepakatan khusus / promo">
                          <span className="text-[10px] text-slate-400">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.custom_price !== undefined ? (item.custom_price === 0 ? '0' : item.custom_price) : item.product.base_price}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, '');
                              updateItemCustomPrice(item.product.id, clean === '' ? 0 : parseInt(clean, 10));
                            }}
                            className="w-16 bg-transparent text-right font-bold text-xs text-[#E5C365] focus:outline-none focus:bg-slate-800 rounded px-0.5 selection:bg-[#D4AF37] selection:text-black"
                            title="Ketik manual harga satuan"
                          />
                          <span className="text-[9px] text-slate-500">/{unit}</span>
                        </div>

                        {/* Quick Add for Bibit in Cart */}
                        {item.product.product_type === 'BIBIT' && (
                          <div className="flex items-center gap-1 ml-auto">
                            {[10, 30].map((addMl) => (
                              <button
                                key={addMl}
                                type="button"
                                onClick={() => updateQuantity(item.product.id, addMl)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-[#D4AF37] hover:text-black text-slate-300 text-[9px] font-medium transition-colors border border-slate-700"
                              >
                                +{addMl}ml
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {cart.length === 0 && (
                  <div className="text-center py-24 text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Keranjang masih kosong.</p>
                    <p className="text-[11px] text-slate-600 mt-1">Pilih item dari katalog atau scan barcode.</p>
                  </div>
                )}
              </div>

              {/* Pilihan Remark Klasifikasi Jenis Parfum */}
              <div className="px-4 py-2.5 border-t border-[#1E293B] bg-[#0A0F1D]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Remark Jenis Parfum:
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                    {selectedTier}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Standard', 'Premium', 'Luxury', 'Primescent'] as PerfumeTier[]).map((tier) => {
                    const isSelected = selectedTier === tier;
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                          isSelected
                            ? tier === 'Primescent'
                              ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-300 font-black'
                              : tier === 'Luxury'
                              ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300 font-black'
                              : tier === 'Premium'
                              ? 'bg-[#D4AF37] text-slate-950 shadow-md ring-1 ring-amber-200 font-black'
                              : 'bg-slate-200 text-slate-950 shadow-md ring-1 ring-white font-black'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {tier}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cart Summary & Pay Action */}
              <div className="p-4 border-t border-[#1E293B] bg-[#0D1220] space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Diskon Produk</span>
                      <span>-{formatIDR(totalDiscount)}</span>
                    </div>
                  )}
                  {pointDiscount > 0 && (
                    <div className="flex justify-between text-[#D4AF37] font-semibold">
                      <span>Diskon Poin Loyalty ({pointsToRedeemNumber} pts)</span>
                      <span>-{formatIDR(pointDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#1E293B]">
                    <span>Total Pembayaran</span>
                    <span className="text-base text-[#D4AF37] font-black">{formatIDR(finalAmount)}</span>
                  </div>
                </div>

                <Button
                  variant="gold"
                  onClick={handleOpenPayment}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 text-sm font-bold shadow-xl shadow-[#D4AF37]/10 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Bayar Sekarang ({formatIDR(finalAmount)})
                </Button>
              </div>
            </div>
          </div>

          {/* FLOATING STICKY BOTTOM CHECKOUT TRIGGER FOR MOBILE */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#090D16]/95 backdrop-blur-md border-t border-[#1E293B] z-40 flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="relative w-11 h-11 rounded-xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition"
                title="Buka Keranjang"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#090D16]">
                    {cart.reduce((a, b) => a + b.quantity, 0)}
                  </span>
                )}
              </button>
              <div>
                <p className="text-[10px] text-slate-400">Total ({cart.reduce((a, b) => a + b.quantity, 0)} item):</p>
                <p className="text-sm font-black text-[#D4AF37] font-mono">{formatIDR(finalAmount)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 active:scale-95 transition"
            >
              <span>Keranjang &amp; Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* MODAL 1: BUKA / TUTUP SESI KASIR */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title={sessionAction === 'OPEN' ? 'Buka Laci Kasir (Shift Baru)' : 'Tutup Laci Kasir (Rekonsiliasi Shift)'}
      >
        <div className="space-y-4">
          {sessionAction === 'OPEN' ? (
            <>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Sisa Cash Tersedia di Toko:</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">{formatIDR(availableCash)}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Otomatis diambil dari sisa Cash fisik yang belum disetor ke Super Admin.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Modal Awal Kas (IDR)</label>
                <Input
                  type="number"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpeningCashInput(availableCash.toString())}
                  className="flex-1 py-1.5 text-xs rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-semibold"
                >
                  Pakai Sisa Cash ({formatIDR(availableCash)})
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Modal Awal Shift:</span>
                  <span>{formatIDR(session?.opening_cash || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Penjualan Tunai Shift Ini:</span>
                  <span className="text-emerald-400">+{formatIDR(session?.total_sales_cash || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1.5 border-t border-slate-800">
                  <span>Total Kas Seharusnya di Laci:</span>
                  <span className="text-[#D4AF37] font-mono text-sm">
                    {formatIDR(availableCash)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  * Otomatis disinkronkan: modal awal + penjualan tunai - beban toko - setoran disetujui.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Uang Fisik Aktual di Laci (IDR)</label>
                <Input
                  type="number"
                  value={closingCashInput}
                  onChange={(e) => setClosingCashInput(e.target.value)}
                  placeholder="Masukkan total uang fisik terhitung"
                />
              </div>

              {closingCashInput && (
                <div className="text-xs">
                  {Number(closingCashInput) === availableCash ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uang fisik pas (Selisih: Rp 0)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Selisih Kas:{' '}
                      {formatIDR(Number(closingCashInput) - availableCash)}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Catatan Shift (Opsional)</label>
            <Input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Contoh: Shift Pagi / Penyerahan ke Kasir Siang"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsSessionModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant={sessionAction === 'OPEN' ? 'gold' : 'danger'}
              onClick={handleSessionSubmit}
              disabled={sessionSubmitting}
            >
              {sessionSubmitting
                ? 'Memproses...'
                : sessionAction === 'OPEN'
                ? 'Konfirmasi Buka Kasir'
                : 'Tutup & Rekonsiliasi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PILIH & DAFTAR MEMBER LOYALTY */}
      <Modal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Member & Loyalty Program"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Cari Member Terdaftar</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau nomor HP member..."
                value={memberSearch}
                onChange={(e) => searchMembers(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-100"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 mt-2 pr-1">
              {membersList.slice(0, 30).map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedMember(m);
                    setIsMemberModalOpen(false);
                  }}
                  className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-white">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.phone} • Tier {m.tier}</p>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37]">{m.points_balance} Poin</span>
                </div>
              ))}
              {membersList.length > 30 && (
                <p className="text-[10px] text-center text-slate-500 py-1.5 font-mono">
                  Menampilkan 30 dari {membersList.length} member. Ketik nama/HP di atas untuk mempersempit.
                </p>
              )}
              {membersList.length === 0 && (
                <p className="text-xs text-center text-slate-500 py-4">
                  Tidak ada member ditemukan.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-2">Daftar Member Baru</h4>
            <form onSubmit={handleRegisterMember} className="space-y-2">
              <Input
                type="text"
                placeholder="Nama Lengkap Pelanggan"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Nomor Telepon / WhatsApp (08...)"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                required
              />
              <Button type="submit" variant="secondary" size="sm" className="w-full text-xs">
                Simpan & Pasang Member ke Keranjang
              </Button>
            </form>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: PEMBAYARAN POS */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Pembayaran Transaksi"
      >
        <div className="space-y-4">
          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Tagihan:</span>
            <span className="text-lg font-black text-[#D4AF37]">{formatIDR(finalAmount)}</span>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { method: 'CASH' as PaymentMethod, label: 'Tunai (Cash)', icon: DollarSign },
                { method: 'QRIS' as PaymentMethod, label: 'QRIS', icon: QrCode },
              ].map((item) => {
                const Icon = item.icon;
                const active = paymentMethod === item.method;
                return (
                  <button
                    key={item.method}
                    type="button"
                    onClick={() => setPaymentMethod(item.method)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      active
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-bold shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CASH INPUT & QUICK BUTTONS */}
          {paymentMethod === 'CASH' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Uang Tunai Diterima (IDR)</label>
                <Input
                  type="number"
                  value={cashAmountInput}
                  onChange={(e) => setCashAmountInput(e.target.value)}
                  placeholder="Masukkan nominal uang"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashAmountInput(finalAmount.toString())}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-[#D4AF37] font-semibold border border-[#D4AF37]/30"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000, 300000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashAmountInput(val.toString())}
                    className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {val / 1000}k
                  </button>
                ))}
              </div>

              {/* Kembalian Box */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Kembalian:</span>
                <span className={`font-bold text-sm ${changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatIDR(changeAmount)}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Nomor Referensi / Trace (Opsional)</label>
              <Input
                type="text"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                placeholder="Contoh: QRIS-BCA-98129031"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsPayModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="gold"
              onClick={handleProcessCheckout}
              disabled={checkoutSubmitting || (paymentMethod === 'CASH' && cashAmountNumber < finalAmount)}
              className="px-6"
            >
              {checkoutSubmitting ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: STRUK PEMBELIAN THERMAL 58mm / 80mm */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Transaksi Berhasil — Struk Thermal"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Ukuran Printer Thermal:</span>
            <div className="flex gap-1">
              {(['58mm', '80mm'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setReceiptPaperSize(size)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    receiptPaperSize === size
                      ? 'bg-[#D4AF37] text-black font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* RECEIPT PAPER CONTAINER */}
          <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
            <div
              id="thermal-receipt"
              style={{ width: receiptPaperSize === '58mm' ? '280px' : '380px' }}
              className="bg-white text-black p-4 rounded shadow-2xl font-mono text-[11px] leading-tight select-none"
            >
              {/* Header Struk */}
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <div className="flex justify-center mb-1">
                  <img src="/logo-black.png" alt="BB Parfum" className="w-9 h-9 object-contain" />
                </div>
                <p className="font-bold text-sm tracking-wider">BB PARFUM PREMIUM</p>
                <p className="text-[10px] text-gray-700">{completedSale?.store?.name || store?.name}</p>
                <p className="text-[9px] text-gray-600">{completedSale?.store?.address || store?.address}</p>
                <p className="text-[9px] text-gray-600">Telp: {completedSale?.store?.phone || store?.phone}</p>
              </div>

              {/* Meta Struk */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>No: {completedSale?.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wkt: {completedSale?.created_at ? formatDateTimeJakarta(completedSale.created_at) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir: {completedSale?.cashier?.full_name || user?.full_name}</span>
                </div>
                {completedSale?.member && (
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-dotted border-gray-300">
                    <span>Member: {completedSale.member.name}</span>
                  </div>
                )}
              </div>

              {/* Item List (Ingredients & Takaran, Harga Satuan Disembunyikan) */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-gray-700 pb-1 border-b border-dotted border-gray-300 uppercase tracking-wider">
                  <span>Ingredients</span>
                  <span>Takaran</span>
                </div>
                {completedSale?.items?.map((it) => {
                  const unit = it.product?.unit_name || (it.product?.product_type === 'BIBIT' ? 'ml' : 'pcs');
                  return (
                    <div key={it.id} className="flex justify-between text-[10px]">
                      <span className="font-semibold truncate max-w-[70%]">{it.product?.name}</span>
                      <span className="text-gray-800 font-medium">{it.quantity} {unit}</span>
                    </div>
                  );
                })}
              </div>

              {/* Summary Struk (Hanya Total Harga Pilihan) */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                {(completedSale?.discount_amount || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Diskon:</span>
                    <span>-{formatIDR(completedSale?.discount_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-0.5">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span>{formatIDR(completedSale?.final_amount || 0)}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span>Bayar ({completedSale?.payments?.[0]?.payment_method || 'CASH'}):</span>
                  <span>{formatIDR(completedSale?.payments?.[0]?.amount || completedSale?.final_amount || 0)}</span>
                </div>
                {completedSale?.payments?.[0]?.payment_method === 'CASH' && (
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>{formatIDR(completedSale?.payments?.[0]?.change_amount || 0)}</span>
                  </div>
                )}
                {completedSale?.points_earned !== undefined && completedSale.points_earned > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-dashed border-gray-300">
                    <span>Reward Poin Didapat:</span>
                    <span>+{completedSale.points_earned} Poin</span>
                  </div>
                )}
              </div>

              {/* Footer Struk */}
              <div className="text-center pt-3 text-[9px] text-gray-600 space-y-0.5">
                <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar</p>
                <p>kecuali ada perjanjian retur resmi.</p>
                <p className="pt-1 text-[8px] text-gray-400">BB Parfum Management System</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (completedSale) {
                  window.open(`/cashier/receipt/${completedSale.id}?size=${receiptPaperSize}`, '_blank');
                }
              }}
            >
              Buka Halaman Cetak Penuh
            </Button>
            <div className="flex gap-2">
              <Button
                variant="gold"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk Sekarang
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 5: RACIK / CAMPUR BIBIT PARFUM (CUSTOM BLEND) */}
      <Modal
        isOpen={isBlendModalOpen}
        onClose={() => setIsBlendModalOpen(false)}
        title="🧪 Racik Parfum Custom (Campuran Bibit & Takaran Manual)"
        description="Campurkan 1 atau 2 bibit parfum murni ke dalam botol dengan takaran ml presisi dan harga jual fleksibel."
        maxWidth="lg"
      >
        <form onSubmit={handleAddBlendToCart} className="space-y-4 text-slate-200">
          {/* Target Kapasitas Botol (Input Angka Manual + Quick Chips) */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200">
                Target Ukuran Botol Racikan (ml)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Kapasitas:</span>
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={blendBottleSize}
                  onChange={(e) => {
                    const sz = Math.max(5, parseInt(e.target.value) || 30);
                    setBlendBottleSize(sz);
                    setBlendBibit1Ml(Math.round(sz / 2));
                    setBlendBibit2Ml(Math.round(sz / 2));
                  }}
                  className="w-16 px-2 py-0.5 bg-[#162036] border border-[#1E293B] focus:border-[#D4AF37] rounded text-xs font-bold text-white text-center"
                />
                <span className="text-xs font-bold text-[#E5C365]">ml</span>
              </div>
            </div>

            {/* Quick Chips Preset */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[15, 30, 35, 50, 60, 100].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setBlendBottleSize(sz);
                    setBlendBibit1Ml(Math.round(sz / 2));
                    setBlendBibit2Ml(Math.round(sz / 2));
                  }}
                  className={`px-3 py-1 rounded-lg border text-xs transition-all font-semibold ${
                    blendBottleSize === sz
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm font-bold'
                      : 'bg-[#162036] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {sz} ml
                </button>
              ))}
            </div>
          </div>

          {/* Form Racikan Bibit 1 (Input Manual ml & Stepper) */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E5C365] flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5" />
                <span>Bibit Utama 1 (Wajib)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBlendBibit1Ml(Math.max(1, blendBibit1Ml - 1))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={blendBottleSize}
                  value={blendBibit1Ml}
                  onChange={(e) => setBlendBibit1Ml(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 px-1.5 py-0.5 bg-[#162036] border border-[#1E293B] focus:border-[#D4AF37] rounded text-xs font-bold text-white text-center"
                />
                <span className="text-[11px] text-slate-400">ml</span>
                <button
                  type="button"
                  onClick={() => setBlendBibit1Ml(Math.min(blendBottleSize, blendBibit1Ml + 1))}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              <div className="sm:col-span-2">
                <select
                  value={blendBibit1Id}
                  onChange={(e) => setBlendBibit1Id(e.target.value)}
                  className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  <option value="">-- Pilih Bibit Parfum 1 --</option>
                  {bibitProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {inventoryMap[p.id] || 0} ml) - {formatIDR(p.base_price)}/ml
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="range"
                  min="1"
                  max={blendBottleSize}
                  value={blendBibit1Ml}
                  onChange={(e) => setBlendBibit1Ml(parseInt(e.target.value) || 1)}
                  className="w-full accent-[#D4AF37]"
                />
              </div>
            </div>
          </div>

          {/* Form Racikan Bibit 2 (Input Manual ml & Stepper) */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Beaker className="w-3.5 h-3.5" />
                <span>Bibit Campuran 2 (Opsional)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setBlendBibit2Ml(Math.max(0, blendBibit2Ml - 1))}
                  disabled={!blendBibit2Id}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center disabled:opacity-30"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max={blendBottleSize}
                  value={blendBibit2Ml}
                  onChange={(e) => setBlendBibit2Ml(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={!blendBibit2Id}
                  className="w-14 px-1.5 py-0.5 bg-[#162036] border border-[#1E293B] focus:border-amber-400 rounded text-xs font-bold text-white text-center disabled:opacity-30"
                />
                <span className="text-[11px] text-slate-400">ml</span>
                <button
                  type="button"
                  onClick={() => setBlendBibit2Ml(Math.min(blendBottleSize, blendBibit2Ml + 1))}
                  disabled={!blendBibit2Id}
                  className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              <div className="sm:col-span-2">
                <select
                  value={blendBibit2Id}
                  onChange={(e) => setBlendBibit2Id(e.target.value)}
                  className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- Tanpa Campuran Bibit 2 --</option>
                  {bibitProducts
                    .filter((p) => p.id !== blendBibit1Id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {inventoryMap[p.id] || 0} ml) - {formatIDR(p.base_price)}/ml
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <input
                  type="range"
                  min="0"
                  max={blendBottleSize}
                  value={blendBibit2Ml}
                  onChange={(e) => setBlendBibit2Ml(parseInt(e.target.value) || 0)}
                  disabled={!blendBibit2Id}
                  className="w-full accent-amber-400 disabled:opacity-30"
                />
              </div>
            </div>
          </div>

          {/* Pelarut & Botol Kosong (Input Manual ml) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pelarut / Absolute</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={blendBottleSize}
                    value={blendPelarutMl}
                    onChange={(e) => setBlendPelarutMl(Math.max(0, parseInt(e.target.value) || 0))}
                    disabled={!blendPelarutId}
                    className="w-14 px-1.5 py-0.5 bg-[#162036] border border-[#1E293B] rounded text-xs font-bold text-white text-center disabled:opacity-30"
                  />
                  <span className="text-[10px] text-slate-400">ml</span>
                </div>
              </div>
              <select
                value={blendPelarutId}
                onChange={(e) => setBlendPelarutId(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">-- Tanpa Pelarut Tambahan --</option>
                {pelarutProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {inventoryMap[p.id] || 0} ml)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wine className="w-3.5 h-3.5 text-purple-400" />
                <span>Botol Kemasan Kosong</span>
              </label>
              <select
                value={blendBottleId}
                onChange={(e) => setBlendBottleId(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">-- Bawa Botol Sendiri / Tanpa Botol --</option>
                {botolProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {inventoryMap[p.id] || 0} pcs) - {formatIDR(p.base_price)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KONTROL HARGA MANUAL / FLEKSIBEL RACIKAN */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-[#162036] to-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Harga Jual Racikan (Manual / Fleksibel)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Estimasi Normal: {formatIDR(
                  (products.find(p => p.id === blendBibit1Id)?.base_price || 0) * blendBibit1Ml +
                  (products.find(p => p.id === blendBibit2Id)?.base_price || 0) * blendBibit2Ml +
                  (products.find(p => p.id === blendBottleId)?.base_price || 0)
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={blendCustomPrice}
                onChange={(e) => setBlendCustomPrice(e.target.value)}
                placeholder="Ketik harga manual paket racik (Rp), kosongkan untuk harga otomatis"
                className="text-xs font-bold text-[#E5C365]"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const auto = (products.find(p => p.id === blendBibit1Id)?.base_price || 0) * blendBibit1Ml +
                    (products.find(p => p.id === blendBibit2Id)?.base_price || 0) * blendBibit2Ml +
                    (products.find(p => p.id === blendBottleId)?.base_price || 0);
                  setBlendCustomPrice(auto.toString());
                }}
                className="text-[11px] whitespace-nowrap bg-slate-800 text-slate-200 border-slate-700"
              >
                Gunakan Estimasi
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>Kasir leluasa mengisi harga manual untuk promo, bundling, atau diskon khusus langganan.</span>
            </p>
          </div>

          {/* Nama / Label Racikan Custom */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Nama / Label Racikan (Opsional)</label>
            <Input
              type="text"
              value={blendCustomName}
              onChange={(e) => setBlendCustomName(e.target.value)}
              placeholder="Contoh: Racikan Mawar + Vanilla 35ml"
              className="text-xs"
            />
          </div>

          {/* Meter Takaran Botol */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Takaran Campuran:</span>
              <span className={`font-bold ${blendBibit1Ml + blendBibit2Ml + blendPelarutMl > blendBottleSize ? 'text-rose-400' : 'text-[#D4AF37]'}`}>
                {blendBibit1Ml + blendBibit2Ml + blendPelarutMl} ml / {blendBottleSize} ml
              </span>
            </div>

            {/* Visual Gauge */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (blendBibit1Ml / blendBottleSize) * 100)}%` }}
                className="h-full bg-[#D4AF37]"
                title={`Bibit 1: ${blendBibit1Ml} ml`}
              />
              <div
                style={{ width: `${Math.min(100, (blendBibit2Ml / blendBottleSize) * 100)}%` }}
                className="h-full bg-amber-500"
                title={`Bibit 2: ${blendBibit2Ml} ml`}
              />
              <div
                style={{ width: `${Math.min(100, (blendPelarutMl / blendBottleSize) * 100)}%` }}
                className="h-full bg-blue-500"
                title={`Pelarut: ${blendPelarutMl} ml`}
              />
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D4AF37]" /> Bibit 1</span>
              {blendBibit2Id && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Bibit 2</span>}
              {blendPelarutId && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Pelarut</span>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsBlendModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={!blendBibit1Id || blendBibit1Ml <= 0}
              className="flex items-center gap-1.5 px-5 font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Masukkan Racikan ke Keranjang</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
