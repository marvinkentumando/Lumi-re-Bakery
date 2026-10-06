import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, Clock } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, subtotal, totalItems } = useCart();
  
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  // Estimated pickup time: 30-45 mins from now
  const pickupTime = new Date();
  pickupTime.setMinutes(pickupTime.getMinutes() + 35);
  const timeString = pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">Your Shopping Bag</h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Trash2 size={24} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Your bag is empty.</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-4 text-sm text-slate-900 underline underline-offset-4"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        <span className="text-sm font-mono font-medium text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                          >
                            <Minus size={14} className="text-slate-600" />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                          >
                            <Plus size={14} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Summary */}
            {items.length > 0 && (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-6 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Est. Pickup: {timeString} Today
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax (8%)</span>
                    <span className="font-mono text-slate-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-mono font-bold text-lg text-slate-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                  Complete Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
