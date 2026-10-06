export default function Footer() {
  return (
    <footer className="py-12 border-t border-slate-200 bg-white">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-xl font-display font-bold text-slate-900">Lumière</span>
            <span className="text-xs text-slate-400">© 2026 Lumière Bakery Artisans</span>
          </div>
          
          <div className="flex gap-8 text-xs font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900">Instagram</a>
            <a href="#" className="hover:text-slate-900">Philosophy</a>
            <a href="#" className="hover:text-slate-900">Sourcing</a>
            <a href="#" className="hover:text-slate-900">Privacy</a>
          </div>
          
          <div className="text-xs text-slate-400">
            124 Heritage Lane, West Hearth · Open Daily 07:00—16:00
          </div>
        </div>
      </div>
    </footer>
  );
}
