export default function Footer() {
  return (
    <footer className="py-14 border-t border-slate-200 bg-white">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pb-8 border-b border-slate-100">
          <div className="flex flex-col items-start gap-1">
            <span className="text-xl font-display font-bold text-slate-900 tracking-tight">Lumière</span>
            <span className="text-xs text-slate-400">Artisanal Bakehouse & Hearth Kitchen</span>
          </div>
          
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-6 text-xs font-medium text-slate-500 justify-start md:justify-center">
            <a href="#menu" className="hover:text-slate-900 transition-colors">Daily Menu</a>
            <a href="#booking" className="hover:text-slate-900 transition-colors">Workshops</a>
            <a href="#story" className="hover:text-slate-900 transition-colors">Our Philosophy</a>
            <a href="#booking" className="hover:text-slate-900 transition-colors">Table Reservations</a>
          </nav>
          
          <div className="text-xs text-slate-500 md:text-right space-y-0.5">
            <p className="font-medium text-slate-800">124 Heritage Lane, West Hearth</p>
            <p className="text-slate-400">Doors Open Daily 07:00 — 16:00</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>© 2026 Lumière Bakery. Organic stoneground leavened breads.</span>
          <span>Crafted with patience and heritage wild cultures.</span>
        </div>
      </div>
    </footer>
  );
}
