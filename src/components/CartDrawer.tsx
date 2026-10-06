import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, Clock, CheckCircle2, ArrowRight, Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/src/context/CartContext';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, subtotal, totalItems, clearCart } = useCart();
  
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState({
    name: auth.currentUser?.displayName || '',
    email: auth.currentUser?.email || '',
    notes: '',
  });

  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  
  // Calculate fixed pickup time 35 minutes from now
  const [pickupTimeString] = useState(() => {
    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + 35);
    return pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const handleStartCheckout = () => {
    setErrorMessage(null);
    setCheckoutStep('checkout');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const ordersPath = 'orders';
    try {
      const ordersCol = collection(db, ordersPath);
      const newOrderRef = doc(ordersCol);
      const orderId = newOrderRef.id;

      const orderPayload: Record<string, unknown> = {
        id: orderId,
        customerName: customerInfo.name.trim() || 'Bakery Guest',
        customerEmail: customerInfo.email.trim(),
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: Number((item.price * item.quantity).toFixed(2)),
        })),
        subtotal,
        tax,
        total,
        pickupTime: `${pickupTimeString} Today`,
        status: 'received',
        createdAt: serverTimestamp(),
      };

      if (customerInfo.notes.trim()) {
        orderPayload.notes = customerInfo.notes.trim().slice(0, 1000);
      }

      if (auth.currentUser?.uid) {
        orderPayload.userId = auth.currentUser.uid;
      }

      await setDoc(newOrderRef, orderPayload);

      setConfirmedOrderId(orderId.slice(0, 8).toUpperCase());
      clearCart();
      setCheckoutStep('success');
    } catch (err) {
      console.error('Order placement error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to place order. Please check connection.');
      try {
        handleFirestoreError(err, OperationType.CREATE, ordersPath);
      } catch {
        // Logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (checkoutStep === 'success') {
      setCheckoutStep('cart');
      setConfirmedOrderId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-60"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-70 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900">
                  {checkoutStep === 'checkout'
                    ? 'Pickup Checkout'
                    : checkoutStep === 'success'
                    ? 'Order Confirmed'
                    : 'Your Shopping Bag'}
                </h2>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">
                  {checkoutStep === 'success'
                    ? 'Order Ready for Hearth Pickup'
                    : `${totalItems} ${totalItems === 1 ? 'Item' : 'Items'}`}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close bag"
                className="p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-6">
              {checkoutStep === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Order #{confirmedOrderId}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
                    Baked Fresh & Reserved
                  </h3>
                  <p className="text-sm text-slate-600 mb-6 max-w-xs leading-relaxed">
                    Your order has been sent directly to the hearth ovens. Pick up at our counter by{' '}
                    <strong className="text-slate-900">{pickupTimeString} Today</strong>.
                  </p>

                  <div className="w-full bg-slate-50 rounded-xl p-4 text-left border border-slate-100 mb-6 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Pickup Counter</span>
                      <span className="font-semibold text-slate-800">124 Heritage Lane, West Hearth</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Status</span>
                      <span className="font-semibold text-emerald-600">Freshly In Preparation</span>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Back to Bakery Menu
                  </button>
                </div>
              ) : checkoutStep === 'checkout' ? (
                <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-5">
                  <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                    <Clock size={16} className="shrink-0 text-amber-700" />
                    <span>Estimated pickup: <strong>{pickupTimeString} Today</strong> at our hearth counter.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Your Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Jean Lumière"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Email for Pickup Receipt
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="jean@example.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Order Notes (Slicing, Bagging preferences)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please pre-slice the sourdough loaf..."
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      {errorMessage}
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('cart')}
                      className="px-4 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 bg-slate-900 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      Confirm & Pay at Pickup (${total.toFixed(2)})
                    </button>
                  </div>
                </form>
              ) : items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-16">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <ShoppingBag size={24} />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 mb-1">Your bag is empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mb-6">
                    Add our wild sourdough or morning laminated croissants to reserve fresh bakehouse items.
                  </p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-xs uppercase tracking-widest font-bold text-slate-900 underline underline-offset-4 cursor-pointer"
                  >
                    Explore Menu Offerings
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 group items-center">
                      <div className="w-18 h-18 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h3>
                          <span className="text-sm font-mono font-medium text-slate-900 shrink-0">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              aria-label="Decrease quantity"
                              className="p-1 hover:bg-white hover:shadow-xs rounded transition-all cursor-pointer"
                            >
                              <Minus size={13} className="text-slate-600" />
                            </button>
                            <span className="w-7 text-center text-xs font-mono font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              aria-label="Increase quantity"
                              className="p-1 hover:bg-white hover:shadow-xs rounded transition-all cursor-pointer"
                            >
                              <Plus size={13} className="text-slate-600" />
                            </button>
                          </div>
                          <button
                            onClick={() => updateQuantity(item.id, -item.quantity)}
                            aria-label="Remove item"
                            className="text-xs text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Summary (when items exist and not on success step) */}
            {items.length > 0 && checkoutStep === 'cart' && (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center gap-2 text-emerald-700 mb-5 bg-emerald-50/80 p-3 rounded-lg border border-emerald-200/60">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Ready for pickup: {pickupTimeString} Today
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-mono text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Local Tax (8%)</span>
                    <span className="font-mono text-slate-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900">Estimated Total</span>
                    <span className="font-mono font-bold text-lg text-slate-900">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleStartCheckout}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer shadow-sm"
                >
                  <span>Proceed to Pickup Checkout</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
