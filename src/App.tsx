import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Menu from './components/Menu';
import BookingForm from './components/BookingForm';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import { CartProvider } from './context/CartContext';

export default function App() {
  const [currentView, setCurrentView] = useState<'storefront' | 'admin'>(() => {
    return window.location.hash === '#admin' ? 'admin' : 'storefront';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else if (window.location.hash === '#storefront' || window.location.hash === '') {
        setCurrentView('storefront');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openAdmin = () => {
    setCurrentView('admin');
    window.location.hash = '#admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openStorefront = () => {
    setCurrentView('storefront');
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'admin') {
    return (
      <CartProvider>
        <AdminDashboard onBackToStorefront={openStorefront} />
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
        <Header onOpenAdmin={openAdmin} />
        <CartDrawer />
        <main>
          <Hero />
          <Menu />
          <BookingForm />
          
          {/* Story Section */}
          <section id="story" className="py-24 border-t border-slate-100">
            <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 block">
                  Heritage Craft
                </span>
                <h2 className="text-4xl font-display font-bold mb-6 text-wrap-balance">
                  Built on patience, stone, and fire.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-6">
                  Lumière was born from a simple obsession: the interaction between wild yeast, 
                  organic stone-milled flour, and the heat of a wood-fired oven.
                </p>
                <p className="text-lg text-slate-600 leading-relaxed">
                  We don't use commercial yeast. We don't use industrial additives. We use 
                  time—sometimes up to 48 hours for a single loaf—to unlock the nutrition 
                  and flavor hidden within the grain.
                </p>
              </div>
              <div className="order-1 md:order-2 rounded-2xl overflow-hidden shadow-2xl scale-105">
                <img 
                  src="/src/assets/images/hero_bakery_interior_1791280823835.jpg" 
                  alt="Our Hearth" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
