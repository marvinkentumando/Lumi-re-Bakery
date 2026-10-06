import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Wild Sourdough',
    description: '36-hour fermented organic heritage wheat with a deep, caramelized crust.',
    price: 12.0,
    category: 'Bread',
    image: '/src/assets/images/menu_sourdough_1791280835840.jpg',
  },
  {
    id: '2',
    name: 'Classic Croissant',
    description: 'Hand-laminated with Normandy butter. 27 layers of crisp, airy perfection.',
    price: 5.5,
    category: 'Pastry',
    image: '/src/assets/images/menu_croissants_1791280846370.jpg',
  },
  {
    id: '3',
    name: 'Seasonal Fruit Tart',
    description: 'Crème pâtissière topped with vine-ripened berries and apricot glaze.',
    price: 8.5,
    category: 'Pastry',
    image: '/src/assets/images/menu_fruit_tart_1791280857062.jpg',
  },
];

export default function Menu() {
  const { addToCart } = useCart();

  return (
    <section id="menu" className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-4">Daily Offerings</h2>
            <p className="text-slate-500 max-w-md">
              Freshly baked every morning at 5:00 AM using only organic, stone-milled grains.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-medium text-slate-400">
            <span>All Items</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-900">Bread</span>
            <span aria-hidden="true">·</span>
            <span>Pastries</span>
            <span aria-hidden="true">·</span>
            <span>Sweets</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MENU_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50 mb-6">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: item.image })}
                  className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-white active:scale-95"
                >
                  <Plus size={20} className="text-slate-900" />
                </button>
              </div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 block">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                </div>
                <span className="text-sm font-mono text-slate-900 font-medium">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
