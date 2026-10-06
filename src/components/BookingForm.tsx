import React, { useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2, Calendar, Users } from 'lucide-react';

export default function BookingForm() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    date: todayStr,
    time: '10:00',
    guests: 2,
    notes: '',
  });
  const [bookingConfirmationId, setBookingConfirmationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    const bookingPath = 'bookings';
    try {
      const bookingsCol = collection(db, bookingPath);
      const newBookingRef = doc(bookingsCol);
      const bookingId = newBookingRef.id;

      // Ensure payload matches schema exactly
      const payload: Record<string, unknown> = {
        id: bookingId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        date: formData.date,
        time: formData.time,
        guests: Number(formData.guests),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      if (formData.notes.trim()) {
        payload.notes = formData.notes.trim().slice(0, 1000);
      }

      if (auth.currentUser?.uid) {
        payload.userId = auth.currentUser.uid;
      }

      await setDoc(newBookingRef, payload);

      setBookingConfirmationId(bookingId.slice(0, 8).toUpperCase());
      setStatus('success');
      setFormData({
        customerName: '',
        customerEmail: '',
        date: todayStr,
        time: '10:00',
        guests: 2,
        notes: '',
      });
    } catch (error) {
      console.error('Booking failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit booking request.');
      try {
        handleFirestoreError(error, OperationType.CREATE, bookingPath);
      } catch {
        // Error logged to console in structured format
      }
    }
  };

  return (
    <section id="booking" className="py-24 bg-slate-50 border-t border-slate-100">
      <div id="workshops" className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="sticky top-28">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3 block">
              Reservations & Masterclasses
            </span>
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-6 text-wrap-balance">
              Sourdough Workshops & Hearthside Tables
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Step into the bakehouse for an immersive exploration of wild fermentations, or reserve a quiet
              morning table beside our communal wood-fired hearth.
            </p>
            
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-xl border border-black/5 shadow-xs">
                <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                  <Calendar size={18} className="text-slate-700" />
                  <span>Mastering the Wild Yeast Workshop</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  Every Saturday, 09:00 — 13:00 · Includes hands-on loaf shaping & sourdough starter jar.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users size={14} />
                  <span>Limited to 8 participants per session</span>
                </div>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden shadow-xs">
                <img 
                  src="/src/assets/images/bakery_process_1791280871294.jpg" 
                  alt="Baker shaping dough at the hearth" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl border border-black/5 shadow-sm">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <CheckCircle2 size={56} className="text-emerald-600 mb-5" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-400 mb-1">
                    Booking Request #{bookingConfirmationId}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mb-3">We have received your request</h3>
                  <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">
                    Our host will review hearth capacity and email your reservation confirmation within 2 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    Make Another Booking
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-display font-bold text-slate-900">Reserve Your Spot</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose your preferred date, party size, and table or workshop slot.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Full Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Jean Lumière"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="jean@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Date
                      </label>
                      <input
                        required
                        type="date"
                        min={todayStr}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Time Slot
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      >
                        <option value="08:00">08:00 AM (Morning Hearth)</option>
                        <option value="10:00">10:00 AM (Table Booking)</option>
                        <option value="12:00">12:00 PM (Lunch Hearth)</option>
                        <option value="14:00">02:00 PM (Afternoon Tea)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Guests
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Special Requests & Dietary Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Let us know about dietary restrictions, sourdough preferences, or seating requests..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={status === 'submitting'}
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {status === 'submitting' && <Loader2 size={16} className="animate-spin" />}
                    Confirm Booking Request
                  </button>
                  
                  {status === 'error' && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <p className="text-xs text-rose-700 font-medium">
                        {errorMessage || 'Unable to submit booking. Please verify your details and try again.'}
                      </p>
                    </div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
