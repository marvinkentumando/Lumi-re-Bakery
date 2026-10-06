import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType, signInWithPopup, googleProvider } from '@/src/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  Users, 
  AlertCircle,
  Search,
  Sparkles,
  DollarSign,
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export interface BookingRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: any;
}

export interface MenuItemRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Bread' | 'Pastry' | 'Sweets';
  imageUrl: string;
  tags?: string[];
  createdAt?: any;
}

export interface OrderRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; price: number; quantity: number; lineTotal: number }>;
  subtotal: number;
  tax: number;
  total: number;
  pickupTime: string;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: any;
}

const PRESET_IMAGES = [
  { label: 'Wild Sourdough Hearth', url: '/src/assets/images/menu_sourdough_1791280835840.jpg' },
  { label: 'Normandy Butter Croissant', url: '/src/assets/images/menu_croissants_1791280846370.jpg' },
  { label: 'Glazed Orchard Fruit Tart', url: '/src/assets/images/menu_fruit_tart_1791280857062.jpg' },
  { label: 'Bakehouse Hearth Interior', url: '/src/assets/images/hero_bakery_interior_1791280823835.jpg' },
  { label: 'Baker Crafting Dough', url: '/src/assets/images/bakery_process_1791280871294.jpg' },
];

const STARTER_MENU_ITEMS: Omit<MenuItemRecord, 'id'>[] = [
  {
    name: 'Wild Heritage Sourdough',
    description: '36-hour slow-fermented organic stoneground flour with an open airy crumb and deeply caramelized hearth crust.',
    price: 12.0,
    category: 'Bread',
    imageUrl: '/src/assets/images/menu_sourdough_1791280835840.jpg',
    tags: ['Organic', 'Naturally Leavened'],
  },
  {
    name: 'Artisan Normandy Croissant',
    description: 'Hand-laminated with cultured Normandy butter. 27 delicate micro-layers for a shatteringly crisp honeycomb interior.',
    price: 5.5,
    category: 'Pastry',
    imageUrl: '/src/assets/images/menu_croissants_1791280846370.jpg',
    tags: ['Cultured Butter', 'Daily Batch'],
  },
  {
    name: 'Seasonal Glazed Fruit Tart',
    description: 'Madagascar vanilla bean crème pâtissière topped with fresh orchard berries and a delicate apricot blossom reduction.',
    price: 8.5,
    category: 'Pastry',
    imageUrl: '/src/assets/images/menu_fruit_tart_1791280857062.jpg',
    tags: ['Fresh Berries', 'Vanilla Bean'],
  },
  {
    name: 'Dark Rye Seeded Boule',
    description: 'Dense, nutty Bavarian-style sourdough infused with toasted sunflower, pumpkin, and cracked flax seeds.',
    price: 13.0,
    category: 'Bread',
    imageUrl: '/src/assets/images/menu_sourdough_1791280835840.jpg',
    tags: ['Wholegrain', 'Ancient Grains'],
  },
  {
    name: 'Valrhona Pain au Chocolat',
    description: 'Dual batons of 70% dark Valrhona French chocolate tucked into golden, butter-laminated pastry.',
    price: 6.25,
    category: 'Pastry',
    imageUrl: '/src/assets/images/menu_croissants_1791280846370.jpg',
    tags: ['Valrhona 70%', 'Hand-Folded'],
  },
  {
    name: 'Almond Frangipane Galette',
    description: 'Flaky butter crust filled with toasted almond paste, roasted pistachios, and dusted with powdered sugar.',
    price: 7.75,
    category: 'Sweets',
    imageUrl: '/src/assets/images/menu_fruit_tart_1791280857062.jpg',
    tags: ['Frangipane', 'Heirloom'],
  },
];

interface AdminDashboardProps {
  onBackToStorefront: () => void;
}

export default function AdminDashboard({ onBackToStorefront }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'menu' | 'orders'>('bookings');
  
  // Data states
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  
  // Loading & Filter states
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRecord | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'Bread' as 'Bread' | 'Pastry' | 'Sweets',
    price: 6.5,
    description: '',
    imageUrl: PRESET_IMAGES[0].url,
    tags: 'Organic, Daily Special',
  });
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Price quick edit
  const [quickPriceEditId, setQuickPriceEditId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<number>(0);

  const adminEmail = 'tumando.marvinken@dnsc.edu.ph';
  const currentUserEmail = auth.currentUser?.email;
  const isSuperAdmin = currentUserEmail === adminEmail;

  // Real-time listener for Bookings
  useEffect(() => {
    setLoadingBookings(true);
    const bookingsCol = collection(db, 'bookings');
    const unsubscribe = onSnapshot(
      bookingsCol,
      (snapshot) => {
        const list: BookingRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        // Sort newest first
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setBookings(list);
        setLoadingBookings(false);
      },
      (err) => {
        console.error('Bookings listener error:', err);
        setLoadingBookings(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time listener for Menu Items
  useEffect(() => {
    setLoadingMenu(true);
    const menuCol = collection(db, 'menu_items');
    const unsubscribe = onSnapshot(
      menuCol,
      (snapshot) => {
        const list: MenuItemRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setMenuItems(list);
        setLoadingMenu(false);
      },
      (err) => {
        console.error('Menu listener error:', err);
        setLoadingMenu(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time listener for Orders
  useEffect(() => {
    const ordersCol = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      ordersCol,
      (snapshot) => {
        const list: OrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setOrders(list);
      },
      (err) => {
        console.error('Orders listener error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Booking actions
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    setUpdatingId(bookingId);
    const path = `bookings/${bookingId}`;
    try {
      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        status: newStatus,
      });
      showNotification('success', `Booking marked as ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showNotification('error', `Failed to update: ${err instanceof Error ? err.message : 'Permission denied'}`);
      try {
        handleFirestoreError(err, OperationType.UPDATE, path);
      } catch {}
    } finally {
      setUpdatingId(null);
    }
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    setUpdatingId(orderId);
    try {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { status: newStatus });
      showNotification('success', `Order updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update order:', err);
      showNotification('error', 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open modal for new item
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setMenuForm({
      name: '',
      category: 'Bread',
      price: 9.5,
      description: '',
      imageUrl: PRESET_IMAGES[0].url,
      tags: 'Organic, Fresh Batch',
    });
    setIsMenuModalOpen(true);
  };

  // Open modal for edit item
  const handleOpenEditModal = (item: MenuItemRecord) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || PRESET_IMAGES[0].url,
      tags: (item.tags || []).join(', '),
    });
    setIsMenuModalOpen(true);
  };

  // Save Menu Item (Create or Edit)
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMenu(true);
    const path = 'menu_items';

    try {
      const tagsArray = menuForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (editingItem) {
        // Edit existing
        const docRef = doc(db, 'menu_items', editingItem.id);
        await updateDoc(docRef, {
          name: menuForm.name.trim(),
          category: menuForm.category,
          price: Number(menuForm.price),
          description: menuForm.description.trim(),
          imageUrl: menuForm.imageUrl,
          tags: tagsArray,
        });
        showNotification('success', `Updated "${menuForm.name}" successfully!`);
      } else {
        // Create new
        const newDocRef = doc(collection(db, 'menu_items'));
        const newId = newDocRef.id;
        await setDoc(newDocRef, {
          id: newId,
          name: menuForm.name.trim(),
          category: menuForm.category,
          price: Number(menuForm.price),
          description: menuForm.description.trim(),
          imageUrl: menuForm.imageUrl,
          tags: tagsArray,
          createdAt: serverTimestamp(),
        });
        showNotification('success', `Added "${menuForm.name}" to menu!`);
      }
      setIsMenuModalOpen(false);
    } catch (err) {
      console.error('Error saving menu item:', err);
      showNotification('error', `Failed to save menu item: ${err instanceof Error ? err.message : 'Check permissions'}`);
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch {}
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Delete menu item
  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) return;
    try {
      await deleteDoc(doc(db, 'menu_items', id));
      showNotification('success', `Removed "${name}" from menu.`);
    } catch (err) {
      console.error('Failed to delete item:', err);
      showNotification('error', 'Failed to delete item.');
    }
  };

  // Quick price update inline
  const handleSaveQuickPrice = async (id: string) => {
    try {
      await updateDoc(doc(db, 'menu_items', id), {
        price: Number(quickPriceValue),
      });
      showNotification('success', 'Price updated successfully!');
      setQuickPriceEditId(null);
    } catch (err) {
      console.error('Failed to update price:', err);
      showNotification('error', 'Failed to update price');
    }
  };

  // Seed default items into Firestore if empty
  const handleSeedMenu = async () => {
    setIsSavingMenu(true);
    try {
      for (const item of STARTER_MENU_ITEMS) {
        const newDocRef = doc(collection(db, 'menu_items'));
        await setDoc(newDocRef, {
          id: newDocRef.id,
          ...item,
          createdAt: serverTimestamp(),
        });
      }
      showNotification('success', 'Populated 6 starter artisanal bakery items into database!');
    } catch (err) {
      console.error('Error seeding menu:', err);
      showNotification('error', 'Could not seed menu. Check permissions.');
    } finally {
      setIsSavingMenu(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'all' ? true : b.status === bookingFilter;
    const matchesSearch =
      b.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.date?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToStorefront}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Storefront</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-lg font-display font-bold text-slate-900">
              Lumière · Staff Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              {isSuperAdmin ? (
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <ShieldCheck size={14} />
                  <span>Admin Verified ({adminEmail})</span>
                </span>
              ) : currentUserEmail ? (
                <span className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  <span>Signed in as {currentUserEmail}</span>
                </span>
              ) : (
                <button
                  onClick={() => signInWithPopup(auth, googleProvider)}
                  className="flex items-center gap-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Sign in as Admin ({adminEmail})</span>
                </button>
              )}
            </div>

            <a
              href="#storefront"
              onClick={(e) => {
                e.preventDefault();
                onBackToStorefront();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View Live Site</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1440px] mx-auto px-6 pt-8">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
              notification.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              <span>Workshop & Table Bookings</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'menu'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign size={14} />
              <span>Menu Items & Pricing</span>
              <span className="text-[10px] text-slate-400 font-mono">({menuItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={14} />
              <span>Counter Pickup Orders</span>
              <span className="text-[10px] text-slate-400 font-mono">({orders.length})</span>
            </button>
          </div>

          {activeTab === 'menu' && (
            <div className="flex items-center gap-2">
              {menuItems.length === 0 && (
                <button
                  onClick={handleSeedMenu}
                  disabled={isSavingMenu}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Seed Default 6 Menu Items</span>
                </button>
              )}
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Add New Creation</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Bookings
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {bookings.length}
                </span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                  Pending Review
                </span>
                <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
                  {pendingCount}
                </span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Confirmed
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
                  {confirmedCount}
                </span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Completed
                </span>
                <span className="text-2xl font-bold font-mono text-blue-600 tabular-nums">
                  {completedCount}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setBookingFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                      bookingFilter === filter
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search guest name, email, date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-900 outline-none transition-all"
                />
              </div>
            </div>

            {/* Bookings Table / Cards */}
            {loadingBookings ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-slate-900" />
                <span className="text-xs">Connecting to hearth reservations...</span>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-16 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                <Calendar size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-slate-700">No bookings found</p>
                <p className="text-xs mt-1">
                  {bookingFilter !== 'all'
                    ? `No bookings with "${bookingFilter}" status.`
                    : 'Customer reservations will appear here in real-time as they are submitted.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-slate-900">
                          {b.customerName}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : b.status === 'cancelled'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">#{b.id.slice(0, 6)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono text-slate-700">{b.customerEmail}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar size={13} />
                          {b.date} at {b.time}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Users size={13} />
                          {b.guests} {b.guests === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </div>

                      {b.notes && (
                        <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 max-w-2xl leading-relaxed">
                          <strong className="text-slate-800">Special Notes:</strong> {b.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      {b.status !== 'confirmed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                          disabled={updatingId === b.id}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 size={13} />
                          <span>Confirm</span>
                        </button>
                      )}

                      {b.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                          disabled={updatingId === b.id}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <span>Complete</span>
                        </button>
                      )}

                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                          disabled={updatingId === b.id}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        >
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU & PRICING */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Active Bakehouse Menu Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changes made here update the public storefront in real time.
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {menuItems.length} Offerings in Database
              </div>
            </div>

            {loadingMenu ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-slate-900" />
                <span className="text-xs">Loading menu items from Firestore...</span>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="p-16 bg-white rounded-xl border border-slate-200 text-center">
                <DollarSign size={32} className="mx-auto mb-3 text-slate-300" />
                <h4 className="text-base font-semibold text-slate-800 mb-1">No Menu Items in Firestore Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  Click "Seed Default 6 Menu Items" to load our curated sourdough and pastry menu into Firestore, or create your first creation manually.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleSeedMenu}
                    disabled={isSavingMenu}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Seed Starter Menu
                  </button>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Add Custom Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={item.imageUrl || PRESET_IMAGES[0].url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                          {item.category}
                        </span>
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h4 className="font-semibold text-slate-900 text-base">{item.name}</h4>
                          
                          {/* Quick Price display or edit */}
                          {quickPriceEditId === item.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono">$</span>
                              <input
                                type="number"
                                step="0.25"
                                value={quickPriceValue}
                                onChange={(e) => setQuickPriceValue(parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 border border-slate-900 rounded text-xs font-mono font-bold"
                              />
                              <button
                                onClick={() => handleSaveQuickPrice(item.id)}
                                className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-semibold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setQuickPriceEditId(null)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setQuickPriceEditId(item.id);
                                setQuickPriceValue(item.price);
                              }}
                              title="Click to quickly edit price"
                              className="group/price flex items-center gap-1 font-mono font-bold text-slate-900 text-sm hover:text-amber-800 transition-colors cursor-pointer"
                            >
                              <span>${item.price.toFixed(2)}</span>
                              <Edit3 size={11} className="opacity-0 group-hover/price:opacity-100 text-slate-400" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {item.description}
                        </p>

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Live on Storefront</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="Edit details"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id, item.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-md border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Counter Pickup Orders</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orders submitted through the customer shopping bag.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700">
                {orders.length} Active Orders
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="p-16 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
                <ShoppingBag size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-semibold text-slate-700">No pickup orders placed yet</p>
                <p className="text-xs mt-1">
                  Customer pickup requests from the shopping bag will arrive here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900 text-base">
                          {ord.customerName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{ord.id.slice(0, 8)}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            ord.status === 'ready'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ord.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : ord.status === 'preparing'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{ord.customerEmail}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock size={13} />
                          {ord.pickupTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-800">Items: </strong>
                        {(ord.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                        <span className="ml-3 font-mono font-bold text-slate-900">
                          Total: ${ord.total?.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-center">
                      {ord.status === 'received' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Mark Preparing
                        </button>
                      )}
                      {ord.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Mark Ready for Counter
                        </button>
                      )}
                      {ord.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Mark Picked Up
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT MENU ITEM */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  {editingItem ? 'Edit Menu Creation' : 'Add New Bakery Creation'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingItem ? 'Update details and pricing live on the site' : 'New creation will immediately appear on the online menu'}
                </p>
              </div>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Item Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cardamom Cinnamon Morning Knot"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all"
                  >
                    <option value="Bread">Bread</option>
                    <option value="Pastry">Pastry</option>
                    <option value="Sweets">Sweets</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Price ($ USD)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.05"
                    min="0.5"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold focus:bg-white focus:border-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Description & Ingredients
                </label>
                <textarea
                  rows={2}
                  placeholder="Short description highlighting grain type, fermentation, or butter..."
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Product Image Photography
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.url}
                      type="button"
                      onClick={() => setMenuForm({ ...menuForm, imageUrl: img.url })}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        menuForm.imageUrl === img.url
                          ? 'border-slate-900 ring-2 ring-slate-900/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded truncate block text-center">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Organic, Heritage Wheat, Special Batch"
                  value={menuForm.tags}
                  onChange={(e) => setMenuForm({ ...menuForm, tags: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-slate-900 outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMenu}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {isSavingMenu && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Publish Creation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
