import Header from './components/Header';
import Hero from './components/Hero';
import Menu from './components/Menu';
import BookingForm from './components/BookingForm';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      <Header />
      <main>
        <Hero />
        <Menu />
        <BookingForm />
        
        {/* Story Section */}
        <section id="story" className="py-24 border-t border-slate-100">
          <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl font-display font-bold mb-6">Built on patience.</h2>
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
  );
}
