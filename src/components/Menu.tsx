import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { db } from '@/src/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Bread' | 'Pastry' | 'Sweets';
  image: string;
  tags: string[];
}

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Wild Heritage Sourdough',
    description: '36-hour slow-fermented organic stoneground flour with an open airy crumb and deeply caramelized hearth crust.',
    price: 12.0,
    category: 'Bread',
    image: '/src/assets/images/menu_sourdough_1791280835840.jpg',
    tags: ['Organic', 'Naturally Leavened'],
  },
  {
    id: '2',
    name: 'Artisan Normandy Croissant',
    description: 'Hand-laminated with cultured Normandy butter. 27 delicate micro-layers for a shatteringly crisp honeycomb interior.',
    price: 5.5,
    category: 'Pastry',
    image: '/src/assets/images/menu_croissants_1791280846370.jpg',
    tags: ['Cultured Butter', 'Daily Batch'],
  },
  {
    id: '3',
    name: 'Seasonal Glazed Fruit Tart',
    description: 'Madagascar vanilla bean crème pâtissière topped with fresh orchard berries and a delicate apricot blossom reduction.',
    price: 8.5,
    category: 'Pastry',
    image: '/src/assets/images/menu_fruit_tart_1791280857062.jpg',
    tags: ['Fresh Berries', 'Vanilla Bean'],
  },
  {
    id: '4',
    name: 'Dark Rye Seeded Boule',
    description: 'Dense, nutty Bavarian-style sourdough infused with toasted sunflower, pumpkin, and cracked flax seeds.',
    price: 13.0,
    category: 'Bread',
    image: '/src/assets/images/menu_sourdough_1791280835840.jpg',
    tags: ['Wholegrain', 'Ancient Grains'],
  },
  {
    id: '5',
    name: 'Valrhona Pain au Chocolat',
    description: 'Dual batons of 70% dark Valrhona French chocolate tucked into golden, butter-laminated pastry.',
    price: 6.25,
    category: 'Pastry',
    image: '/src/assets/images/menu_croissants_1791280846370.jpg',
    tags: ['Valrhona 70%', 'Hand-Folded'],
  },
  {
    id: '6',
    name: 'Almond Frangipane Galette',
    description: 'Flaky butter crust filled with toasted almond paste, roasted pistachios, and dusted with powdered sugar.',
    price: 7.75,
    category: 'Sweets',
    image: '/src/assets/images/menu_fruit_tart_1791280857062.jpg',
    tags: ['Frangipane', 'Heirloom'],
  },
];

type CategoryFilter = 'All' | 'Bread' | 'Pastry' | 'Sweets';

export default function Menu() {
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);

  // Subscribe to live menu items from Firestore
  useEffect(() => {
    const menuCol = collection(db, 'menu_items');
    const unsubscribe = onSnapshot(
      menuCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: MenuItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              name: data.name,
              description: data.description || '',
              price: Number(data.price) || 0,
              category: (data.category as any) || 'Bread',
              image: data.imageUrl || DEFAULT_MENU_ITEMS[0].image,
              tags: data.tags || ['Artisanal Batch'],
            });
          });
          setItems(list);
        } else {
          setItems(DEFAULT_MENU_ITEMS);
        }
      },
      (err) => {
        console.error('Menu items listener error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter((item) => item.category === activeCategory);

  const handleAdd = (item: MenuItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image });
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === item.id ? null : curr));
    }, 1200);
  };

  const categories: CategoryFilter[] = ['All', 'Bread', 'Pastry', 'Sweets'];

  return (
    <section id="menu" className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2 block">
              Bakehouse Hearth Menu
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3">
              Daily Morning Offerings
            </h2>
            <p className="text-slate-500 max-w-lg text-sm leading-relaxed">
              Drawn from stone ovens at 05:00 every morning using certified organic heritage grains, pure water, and sea salt.
            </p>
          </div>

          {/* Interactive filter controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-end">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'All' ? 'All Creations' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -4 }}
                className="group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 mb-5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <button 
                      onClick={() => handleAdd(item)}
                      aria-label={`Add ${item.name} to cart`}
                      className="absolute bottom-3 right-3 p-2.5 bg-white/95 backdrop-blur-xs rounded-full shadow-md transition-all duration-200 hover:bg-slate-900 hover:text-white text-slate-900 cursor-pointer active:scale-95"
                    >
                      {justAddedId === item.id ? (
                        <Check size={18} className="text-emerald-600" />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span>{item.category}</span>
                        {item.tags && item.tags[0] && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{item.tags[0]}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-amber-900 transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-sm font-mono text-slate-900 font-semibold tabular-nums ml-2">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Baked fresh daily</span>
                  <button
                    onClick={() => handleAdd(item)}
                    className="text-xs font-semibold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{justAddedId === item.id ? 'Added to Bag' : '+ Add to Bag'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
