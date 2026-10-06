import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/src/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { ShoppingBag, Menu as MenuIcon, X, Shield } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

interface HeaderProps {
  onOpenAdmin: () => void;
}

export default function Header({ onOpenAdmin }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => signOut(auth);

  const navLinks = [
    { label: 'Menu', href: '#menu' },
    { label: 'Workshops', href: '#workshops' },
    { label: 'Booking', href: '#booking' },
    { label: 'Our Story', href: '#story' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand */}
        <a href="/" className="text-2xl font-display font-bold tracking-tight text-slate-900">
          Lumière
        </a>

        {/* Zone 2: Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onOpenAdmin}
            className="text-sm font-medium text-amber-900 hover:text-slate-900 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Shield size={14} className="text-amber-800" />
            <span>Staff Portal</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(true)}
            aria-label="View shopping bag"
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors relative cursor-pointer"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-slate-900 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-white tabular-nums">
                {totalItems}
              </span>
            )}
          </button>
          
          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-slate-200"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={handleLogout}
                className="hidden sm:block text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button 
            className="md:hidden p-2 text-slate-600 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-base font-medium text-slate-900 py-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenAdmin();
            }}
            className="text-base font-semibold text-amber-900 flex items-center gap-2 py-1 text-left cursor-pointer"
          >
            <Shield size={16} />
            <span>Staff Portal (Bookings & Menu)</span>
          </button>
        </div>
      )}
    </header>
  );
}
