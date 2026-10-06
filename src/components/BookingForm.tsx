import React, { useState } from 'react';
import { db, auth } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    time: '10:00',
    guests: 2,
    notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const id = Math.random().toString(36).substring(2, 15);
      await addDoc(collection(db, 'bookings'), {
        ...formData,
        id,
        userId: auth.currentUser?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setStatus('success');
      setFormData({ name: '', email: '', date: '', time: '10:00', guests: 2, notes: '' });
    } catch (error) {
      console.error('Booking failed', error);
      setStatus('error');
    }
  };

  return (
    <section id="booking" className="py-24 bg-slate-50">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="sticky top-32">
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-6">
              Sourdough Workshops & Table Reservations
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Join us for an intimate look into the art of fermentation or reserve a quiet morning table 
              at our communal wood-fired hearth.
            </p>
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-xl border border-black/5 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-2">Mastering the Wild Yeast</h3>
                <p className="text-sm text-slate-500 mb-4">Every Saturday, 9:00 AM — 1:00 PM</p>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Upcoming: Oct 12 · Oct 19 · Oct 26
                </div>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden grayscale contrast-125 opacity-80">
                <img 
                  src="/src/assets/images/bakery_process_1791280871294.jpg" 
                  alt="Baker at work" 
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
                  <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Requested</h3>
                  <p className="text-slate-500 max-w-xs mb-8">
                    We've received your request and will send a confirmation to your email shortly.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Jean Lumière"
                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="jean@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</label>
                      <select
                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm appearance-none"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      >
                        <option>08:00</option>
                        <option>10:00</option>
                        <option>12:00</option>
                        <option>14:00</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Guests</label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="20"
                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm"
                        value={formData.guests}
                        onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Special Requests</label>
                    <textarea
                      rows={3}
                      placeholder="Let us know about any allergies or preferences..."
                      className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-lg focus:bg-white focus:border-slate-900 outline-none transition-all text-sm resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <button
                    disabled={status === 'submitting'}
                    type="submit"
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'submitting' && <Loader2 size={20} className="animate-spin" />}
                    Confirm Booking Request
                  </button>
                  
                  {status === 'error' && (
                    <p className="text-center text-xs text-rose-500">
                      An error occurred. Please check your connection and try again.
                    </p>
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
