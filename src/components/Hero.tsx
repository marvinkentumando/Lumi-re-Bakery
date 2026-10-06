import { motion } from 'motion/react';

export default function Hero() {
  return (
    <section className="relative w-full h-[80vh] min-h-[600px] flex items-center overflow-hidden bg-slate-50">
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_bakery_interior_1791280823835.jpg"
          alt="Lumière Bakery Interior"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <span className="inline-block text-xs font-bold tracking-widest text-white/80 uppercase mb-4">
            Artisanal · Organic · Hand-crafted
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-8 text-wrap-balance">
            The alchemy of wild yeast and time.
          </h1>
          <div className="flex flex-wrap gap-4">
            <a
              href="#menu"
              className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm uppercase tracking-wide"
            >
              Explore Menu
            </a>
            <a
              href="#booking"
              className="px-8 py-4 bg-transparent border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 backdrop-blur-sm transition-all text-sm uppercase tracking-wide"
            >
              Book a Workshop
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
