import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ArrowLeft, ChevronRight, Check, Loader2,
  Plus, Minus, MapPin, Calendar, Search, X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem } from '@/data/types';

type Step = 'products' | 'info' | 'slot' | 'summary' | 'success';

interface GroupItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  image_url: string;
  quantity: number;
}

interface City {
  id: string;
  name: string;
  active: boolean;
}

interface Slot {
  id: string;
  city_id: string;
  delivery_date: string;
  active: boolean;
}

interface GroupOrderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boutiqueItems: MenuItem[];
}

const DEFAULT_WHATSAPP = '237600000000';

const slide = {
  initial: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  transition: { duration: 0.22, ease: 'easeInOut' as const },
};

const GroupOrderDrawer = ({ open, onOpenChange, boutiqueItems }: GroupOrderDrawerProps) => {
  const [step, setStep] = useState<Step>('products');
  const [dir, setDir] = useState(1);
  const [sending, setSending] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);

  const [search, setSearch] = useState('');
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; slot?: string }>({});

  const [cities, setCities] = useState<City[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');

  const activeCities = cities.filter((c) => c.active);
  const activeSlots = slots.filter((s) => s.city_id === selectedCityId && s.active);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  useEffect(() => {
    supabase.from('informations_pizzeria').select('whatsapp').limit(1).single()
      .then(({ data }) => { if (data?.whatsapp) setWhatsappNumber(String(data.whatsapp)); });
    supabase.from('group_order_cities').select('*').order('position').order('name')
      .then(({ data }) => setCities((data as City[]) ?? []));
    supabase.from('group_order_slots').select('*').order('delivery_date')
      .then(({ data }) => setSlots((data as Slot[]) ?? []));
  }, []);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('products');
        setDir(1);
        setSearch('');
        setBasket({});
        setClientName('');
        setClientPhone('');
        setSelectedCityId('');
        setSelectedSlotId('');
        setErrors({});
      }, 300);
    }
  }, [open]);

  const goTo = (next: Step, direction = 1) => { setDir(direction); setStep(next); };

  const setQty = (id: string, qty: number) => {
    setBasket((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  };

  const selectedItems: GroupItem[] = boutiqueItems
    .filter((i) => basket[String(i.id)] > 0)
    .map((i) => ({
      id: String(i.id),
      name: i.name ?? '',
      price: Number(i.price ?? 0),
      emoji: i.emoji ?? '🛒',
      image_url: i.image_url ?? '',
      quantity: basket[String(i.id)],
    }));

  const total = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const validateInfo = () => {
    const e: typeof errors = {};
    if (!clientName.trim()) e.name = 'Le nom est obligatoire';
    if (!clientPhone.trim()) e.phone = 'Le téléphone est obligatoire';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateSlot = () => {
    if (!selectedSlotId) {
      setErrors({ slot: 'Choisissez une ville et une date de livraison' });
      return false;
    }
    setErrors({});
    return true;
  };

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  const buildMessage = () => {
    const lines = [
      '🏪 *Commande Spéciale – Pizzeria Chez Moi*',
      '',
      `🏙️ *Ville :* ${selectedCity?.name ?? ''}`,
      `📅 *Livraison :* ${selectedSlot ? formatDate(selectedSlot.delivery_date) : ''}`,
      '',
      '*Articles commandés :*',
      ...selectedItems.map(
        (i) => `• ${i.quantity}x ${i.name} — ${(i.price * i.quantity).toLocaleString('fr-FR')} FCFA`,
      ),
      '',
      `💰 *Total : ${total.toLocaleString('fr-FR')} FCFA*`,
      '',
      '*Informations client :*',
      `👤 Nom : ${clientName}`,
      `📞 Tél : ${clientPhone}`,
    ];
    return lines.join('\n');
  };

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSending(true);
    setSubmitError(null);

    const { error: insertError } = await supabase.from('group_orders').insert({
      slot_id: selectedSlotId,
      client_name: clientName,
      client_phone: clientPhone,
      items: selectedItems.map((i) => ({
        id: i.id, name: i.name, price: i.price, quantity: i.quantity, emoji: i.emoji,
      })),
      total,
      status: 'pending',
    });

    if (insertError) {
      setSubmitError('Erreur lors de l\'enregistrement. Vérifiez votre connexion et réessayez.');
      setSending(false);
      return;
    }

    const msg = encodeURIComponent(buildMessage());
    const num = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    goTo('success', 1);
    setSending(false);
    setTimeout(() => onOpenChange(false), 3500);
  };

  const stepTitle: Record<Step, string> = {
    products: 'Choisir les produits',
    info: 'Vos informations',
    slot: 'Ville & date de livraison',
    summary: 'Récapitulatif',
    success: 'Commande envoyée !',
  };

  const STEPS: Step[] = ['products', 'info', 'slot', 'summary'];

  const prevStep: Record<Step, Step | null> = {
    products: null,
    info: 'products',
    slot: 'info',
    summary: 'slot',
    success: null,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl h-[92vh] flex flex-col border-none p-0 outline-none overflow-hidden"
        style={{ background: 'linear-gradient(160deg, hsl(60,3%,9%) 0%, hsl(0,3%,14%) 100%)' }}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10 shrink-0 flex-row items-center gap-3">
          {step !== 'products' && step !== 'success' && (
            <button
              onClick={() => { const prev = prevStep[step]; if (prev) goTo(prev, -1); }}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <SheetTitle className="text-white text-base font-bold flex items-center gap-2 flex-1">
            <Package className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{stepTitle[step]}</span>
          </SheetTitle>
          {step !== 'success' && (
            <div className="flex gap-1.5 shrink-0">
              {STEPS.map((s) => (
                <span
                  key={s}
                  className={`h-1.5 rounded-full transition-all ${
                    s === step ? 'bg-amber-400 w-4' : 'bg-white/20 w-1.5'
                  }`}
                />
              ))}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait" custom={dir}>

            {/* ── STEP: PRODUCTS ── */}
            {step === 'products' && (
              <motion.div key="products" custom={dir} {...slide} className="absolute inset-0 flex flex-col">
                {/* Search bar */}
                <div className="px-5 pt-3 pb-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Rechercher un produit…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl pl-9 pr-9 py-2.5 text-sm outline-none transition"
                      style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.14)', color: 'white' }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      >
                        <X className="w-3 h-3 text-white/50" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
                  {boutiqueItems.filter((i) => i.available !== false && (
                    !search.trim() || (i.name ?? '').toLowerCase().includes(search.trim().toLowerCase())
                  )).map((item) => {
                    const qty = basket[String(item.id)] ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl p-3 flex items-center gap-3"
                        style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name ?? ''} className="w-full h-full object-cover" />
                            : <span className="text-2xl">{item.emoji ?? '🛒'}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                          {item.price != null && (
                            <p className="text-amber-400 text-sm font-bold">
                              {Number(item.price).toLocaleString('fr-FR')} FCFA
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {qty > 0 ? (
                            <>
                              <button
                                onClick={() => setQty(String(item.id), qty - 1)}
                                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                              >
                                <Minus className="w-3 h-3 text-white" />
                              </button>
                              <span className="w-5 text-center text-white font-bold text-sm">{qty}</span>
                              <button
                                onClick={() => setQty(String(item.id), qty + 1)}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition"
                                style={{ background: 'hsl(43,96%,56%)' }}
                              >
                                <Plus className="w-3 h-3 text-neutral-900" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setQty(String(item.id), 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition"
                              style={{ background: 'hsl(43,96%,56%)' }}
                            >
                              <Plus className="w-4 h-4 text-neutral-900" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {search.trim() && boutiqueItems.filter((i) => i.available !== false && (i.name ?? '').toLowerCase().includes(search.trim().toLowerCase())).length === 0 && (
                    <div className="py-10 flex flex-col items-center gap-2 text-white/30">
                      <Search className="w-6 h-6" />
                      <p className="text-sm">Aucun produit trouvé pour « {search} »</p>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-6 pt-3 border-t border-white/10 shrink-0">
                  {selectedItems.length > 0 && (
                    <p className="text-white/50 text-xs text-center mb-3">
                      {selectedItems.reduce((s, i) => s + i.quantity, 0)} article(s) sélectionné(s) — {total.toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                  <button
                    onClick={() => { if (selectedItems.length > 0) goTo('info', 1); }}
                    disabled={selectedItems.length === 0}
                    className="w-full py-3.5 rounded-2xl font-bold text-neutral-900 flex items-center justify-center gap-2 transition disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,hsl(43,96%,56%) 0%,hsl(35,96%,50%) 100%)' }}
                  >
                    Continuer
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: INFO ── */}
            {step === 'info' && (
              <motion.div key="info" custom={dir} {...slide} className="absolute inset-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => { setClientName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
                      placeholder="Ex : Amadou Ndjidda"
                      className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition ${errors.name ? 'border-red-400' : 'border-white/15'}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => { setClientPhone(e.target.value); setErrors((er) => ({ ...er, phone: undefined })); }}
                      placeholder="Ex : 677 123 456"
                      className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition ${errors.phone ? 'border-red-400' : 'border-white/15'}`}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
                <div className="px-5 pb-6 pt-3 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => { if (validateInfo()) goTo('slot', 1); }}
                    className="w-full py-3.5 rounded-2xl font-bold text-neutral-900 flex items-center justify-center gap-2 transition"
                    style={{ background: 'linear-gradient(135deg,hsl(43,96%,56%) 0%,hsl(35,96%,50%) 100%)' }}
                  >
                    Choisir la livraison
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: SLOT ── */}
            {step === 'slot' && (
              <motion.div key="slot" custom={dir} {...slide} className="absolute inset-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  {/* City selector */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" /> Ville de livraison *
                    </label>
                    {activeCities.length === 0 ? (
                      <p className="text-white/30 text-sm py-2">Aucune ville disponible pour l'instant.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {activeCities.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => { setSelectedCityId(city.id); setSelectedSlotId(''); setErrors({}); }}
                            className={`py-3 px-3 rounded-xl border text-sm font-semibold transition text-left ${
                              selectedCityId === city.id
                                ? 'border-amber-400 text-white'
                                : 'border-white/15 text-white/60 hover:border-white/30'
                            }`}
                            style={selectedCityId === city.id
                              ? { background: 'hsl(43,96%,56%,0.15)' }
                              : { background: 'hsl(0,0%,100%,0.05)' }}
                          >
                            📍 {city.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date selector */}
                  {selectedCityId && (
                    <div>
                      <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> Date de livraison *
                      </label>
                      {activeSlots.length === 0 ? (
                        <p className="text-white/30 text-sm py-2">Aucune date disponible pour cette ville.</p>
                      ) : (
                        <div className="space-y-2">
                          {activeSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => { setSelectedSlotId(slot.id); setErrors({}); }}
                              className={`w-full py-3 px-4 rounded-xl border text-sm font-semibold transition text-left flex items-center gap-2 ${
                                selectedSlotId === slot.id
                                  ? 'border-amber-400 text-white'
                                  : 'border-white/15 text-white/60 hover:border-white/30'
                              }`}
                              style={selectedSlotId === slot.id
                                ? { background: 'hsl(43,96%,56%,0.15)' }
                                : { background: 'hsl(0,0%,100%,0.05)' }}
                            >
                              {selectedSlotId === slot.id
                                ? <Check className="w-4 h-4 text-amber-400 shrink-0" />
                                : <span className="w-4 h-4 shrink-0" />}
                              {formatDate(slot.delivery_date)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.slot && <p className="text-red-400 text-xs">{errors.slot}</p>}
                </div>
                <div className="px-5 pb-6 pt-3 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => { if (validateSlot()) goTo('summary', 1); }}
                    className="w-full py-3.5 rounded-2xl font-bold text-neutral-900 flex items-center justify-center gap-2 transition"
                    style={{ background: 'linear-gradient(135deg,hsl(43,96%,56%) 0%,hsl(35,96%,50%) 100%)' }}
                  >
                    Voir le récapitulatif
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: SUMMARY ── */}
            {step === 'summary' && (
              <motion.div key="summary" custom={dir} {...slide} className="absolute inset-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

                  {/* Delivery info */}
                  <div className="rounded-2xl p-4 space-y-2"
                    style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Livraison groupée</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-white text-sm">{selectedCity?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-white text-sm">
                        {selectedSlot ? formatDate(selectedSlot.delivery_date) : ''}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2 flex items-center gap-2">
                      <span className="text-white/50 text-xs">👤</span>
                      <span className="text-white/80 text-sm">{clientName} — {clientPhone}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50 px-4 pt-3 pb-2">Articles</p>
                    <div className="divide-y divide-white/[0.06]">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="px-4 py-2.5 flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{item.emoji}</span>
                            <span className="text-white text-sm truncate">{item.name}</span>
                            <span className="text-white/40 text-xs shrink-0">×{item.quantity}</span>
                          </div>
                          <span className="text-amber-400 font-bold text-sm shrink-0">
                            {(item.price * item.quantity).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-white/10 flex justify-between font-bold">
                      <span className="text-white/70">Total</span>
                      <span className="text-amber-400 text-lg">{total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  {submitError && (
                    <p className="text-red-400 text-xs text-center px-2 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      {submitError}
                    </p>
                  )}
                  <p className="text-white/40 text-xs text-center px-4">
                    En confirmant, votre commande est enregistrée puis transmise via WhatsApp.
                  </p>
                </div>
                <div className="px-5 pb-6 pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                  <button
                    onClick={handleConfirm}
                    disabled={sending}
                    className="w-full py-4 rounded-2xl font-bold text-neutral-900 flex items-center justify-center gap-2 transition disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,hsl(142,70%,35%) 0%,hsl(142,60%,28%) 100%)' }}
                  >
                    {sending
                      ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                      : <span className="text-white">💬 Confirmer et envoyer sur WhatsApp</span>}
                  </button>
                  <button
                    onClick={() => goTo('slot', -1)}
                    className="w-full py-3 rounded-2xl border border-white/15 text-white/60 text-sm font-medium hover:border-white/30 transition"
                  >
                    Modifier
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'hsl(43,96%,56%,0.2)' }}
                >
                  <span className="text-3xl">📦</span>
                </motion.div>
                <p className="text-white font-bold text-xl mb-2">Commande spéciale envoyée !</p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Votre commande groupée a été transmise à la pizzeria via WhatsApp. Vous serez contacté pour confirmation.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export default GroupOrderDrawer;
