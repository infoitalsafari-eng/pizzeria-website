import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowLeft,
  CheckCircle2, ChevronRight, Loader2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/integrations/supabase/client';

/* ─── types ─────────────────────────────────────────────── */
type Step = 'cart' | 'form' | 'summary' | 'success';
type DeliveryType = 'livraison' | 'emporter';

interface CustomerForm {
  name: string;
  phone: string;
  deliveryType: DeliveryType;
  address: string;
  note: string;
}
interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
}

const DEFAULT_WHATSAPP = '237600000000';

const slide = {
  initial: (dir: number) => ({ x: dir * 60, opacity: 0 }),
  animate: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  transition: { duration: 0.22, ease: 'easeInOut' },
};

/* ─── CartDrawer ─────────────────────────────────────────── */
interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, clearCart, itemCount } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const [step, setStep] = useState<Step>('cart');
  const [dir, setDir] = useState(1);
  const [sending, setSending] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP);

  const [form, setForm] = useState<CustomerForm>({
    name: '', phone: '', deliveryType: 'livraison', address: '', note: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /* fetch whatsapp number once */
  useEffect(() => {
    supabase
      .from('informations_pizzeria')
      .select('whatsapp')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.whatsapp) setWhatsappNumber(String(data.whatsapp));
      });
  }, []);

  /* reset on close */
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('cart');
        setDir(1);
        setErrors({});
      }, 300);
    }
  }, [open]);

  const goTo = (next: Step, direction = 1) => {
    setDir(direction);
    setStep(next);
  };

  /* ─── validation ─── */
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Le nom est obligatoire';
    if (!form.phone.trim()) e.phone = 'Le téléphone est obligatoire';
    if (form.deliveryType === 'livraison' && !form.address.trim())
      e.address = "L'adresse est obligatoire pour la livraison";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── WhatsApp message ─── */
  const buildMessage = () => {
    const lines: string[] = [
      '🍕 *Nouvelle commande – Pizzeria Chez Moi*',
      '',
      '*Produits commandés :*',
      ...items.map(
        (i) => `• ${i.quantity}x ${i.name} — ${(i.price * i.quantity).toLocaleString('fr-FR')} FCFA`,
      ),
      '',
      `*Total : ${total.toLocaleString('fr-FR')} FCFA*`,
      '',
      '*Informations client :*',
      `Nom : ${form.name}`,
      `Tél : ${form.phone}`,
      '',
      form.deliveryType === 'livraison'
        ? `*Mode : Livraison* 🚗\nAdresse : ${form.address}`
        : '*Mode : À emporter* 🏪',
    ];
    if (form.note.trim()) {
      lines.push('', `_Note : ${form.note}_`);
    }
    return lines.join('\n');
  };

  /* ─── submit ─── */
  const handleConfirm = async () => {
    setSending(true);
    try {
      /* 1. save to Supabase (best-effort, don't block WhatsApp if it fails) */
      await supabase.from('orders_pizzeria').insert({
        customer_name: form.name,
        phone: form.phone,
        delivery_type: form.deliveryType,
        delivery_address: form.deliveryType === 'livraison' ? form.address : null,
        notes: form.note || null,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          emoji: i.emoji,
        })),
        total,
        status: 'pending',
      });
    } catch (_) {
      /* silent – WhatsApp still opens */
    }

    /* 2. open WhatsApp */
    const msg = encodeURIComponent(buildMessage());
    const num = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');

    /* 3. success state, then clear */
    goTo('success', 1);
    setSending(false);
    setTimeout(() => {
      clearCart();
      onOpenChange(false);
    }, 3500);
  };

  /* ────────────────────────────── RENDER ─────────────────── */

  const stepTitle: Record<Step, string> = {
    cart: 'Mon Panier',
    form: 'Vos informations',
    summary: 'Récapitulatif',
    success: 'Commande envoyée',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl h-[92vh] flex flex-col border-none p-0 outline-none overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, hsl(60,3%,9%) 0%, hsl(0,3%,14%) 100%)',
        }}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10 shrink-0 flex-row items-center gap-3">
          {step !== 'cart' && step !== 'success' && (
            <button
              onClick={() => goTo(step === 'form' ? 'cart' : 'form', -1)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <SheetTitle className="text-white text-lg font-bold flex items-center gap-2 flex-1">
            {step === 'cart' && <ShoppingCart className="w-5 h-5 text-[hsl(0,90%,60%)]" />}
            {stepTitle[step]}
            {step === 'cart' && (
              <span className="text-sm font-normal text-white/50">
                ({itemCount()} article{itemCount() > 1 ? 's' : ''})
              </span>
            )}
          </SheetTitle>
          {/* Step dots */}
          {step !== 'success' && (
            <div className="flex gap-1.5 shrink-0">
              {(['cart', 'form', 'summary'] as Step[]).map((s) => (
                <span
                  key={s}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    s === step ? 'bg-[hsl(0,90%,55%)] w-4' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait" custom={dir}>
            {/* ── STEP: CART ── */}
            {step === 'cart' && (
              <motion.div
                key="cart"
                custom={dir}
                {...slide}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <p className="text-5xl mb-3">🛒</p>
                      <p className="text-white/50 text-sm">Votre panier est vide</p>
                      <p className="text-white/30 text-xs mt-1">Ajoutez des plats depuis le menu</p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center gap-3 rounded-2xl p-3"
                          style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}
                        >
                          <div className="w-12 h-12 rounded-xl bg-[hsl(0,90%,47%)]/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.image_url
                              ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              : <span className="text-2xl">{item.emoji || '🍽️'}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{item.name}</p>
                            <p className="text-[hsl(0,90%,60%)] font-bold text-sm">
                              {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-white/35 text-[11px]">
                                {item.price.toLocaleString('fr-FR')} × {item.quantity}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                              <Minus className="w-3 h-3 text-white" />
                            </button>
                            <span className="w-5 text-center text-white font-bold text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center transition"
                              style={{ background: 'hsl(0,90%,47%)' }}>
                              <Plus className="w-3 h-3 text-white" />
                            </button>
                            <button onClick={() => removeItem(item.id)}
                              className="w-7 h-7 rounded-full flex items-center justify-center ml-1 hover:bg-red-500/20 transition">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="px-5 pb-6 pt-3 border-t border-white/10 space-y-3 shrink-0">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total</span>
                      <span className="text-[hsl(0,90%,60%)] font-bold text-xl">
                        {total.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={clearCart}
                        className="px-4 py-3 rounded-2xl border border-white/15 text-white/60 text-sm font-medium hover:border-white/30 transition">
                        Vider
                      </button>
                      <button onClick={() => goTo('form', 1)}
                        className="flex-1 py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
                        style={{ background: 'linear-gradient(135deg,hsl(0,90%,47%) 0%,hsl(15,90%,40%) 100%)' }}>
                        Valider la commande
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP: FORM ── */}
            {step === 'form' && (
              <motion.div key="form" custom={dir} {...slide} className="absolute inset-0 flex flex-col">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                  {/* Nom */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
                      placeholder="Ex : Amadou Ndjidda"
                      className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[hsl(0,90%,47%)] transition autofill:bg-white/10 ${errors.name ? 'border-red-400' : 'border-white/15'}`}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Téléphone */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => { setForm(f => ({ ...f, phone: e.target.value })); setErrors(er => ({ ...er, phone: undefined })); }}
                      placeholder="Ex : 677 123 456"
                      className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[hsl(0,90%,47%)] transition autofill:bg-white/10 ${errors.phone ? 'border-red-400' : 'border-white/15'}`}
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  {/* Mode */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Mode de réception *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['livraison', 'emporter'] as DeliveryType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, deliveryType: type, address: '' })); setErrors(er => ({ ...er, address: undefined })); }}
                          className={`py-3 rounded-xl border text-sm font-semibold transition ${
                            form.deliveryType === type
                              ? 'border-[hsl(0,90%,47%)] text-white'
                              : 'border-white/15 text-white/50 hover:border-white/30'
                          }`}
                          style={form.deliveryType === type
                            ? { background: 'hsl(0,90%,47%,0.2)' }
                            : { background: 'hsl(0,0%,100%,0.05)' }}
                        >
                          {type === 'livraison' ? '🚗 Livraison' : '🏪 À emporter'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adresse (livraison seulement) */}
                  <AnimatePresence>
                    {form.deliveryType === 'livraison' && (
                      <motion.div
                        key="address"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                          Adresse de livraison *
                        </label>
                        <textarea
                          rows={2}
                          value={form.address}
                          onChange={(e) => { setForm(f => ({ ...f, address: e.target.value })); setErrors(er => ({ ...er, address: undefined })); }}
                          placeholder="Quartier, repère… Ex : Quartier Administratif, à côté de la mairie"
                          className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[hsl(0,90%,47%)] transition resize-none ${errors.address ? 'border-red-400' : 'border-white/15'}`}
                        />
                        {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Note */}
                  <div>
                    <label className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 block">
                      Note / Instructions <span className="normal-case font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.note}
                      onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Ex : sans oignons, sonner 2 fois…"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[hsl(0,90%,47%)] transition resize-none"
                    />
                  </div>
                </div>

                <div className="px-5 pb-6 pt-3 border-t border-white/10 shrink-0">
                  <button
                    onClick={() => { if (validate()) goTo('summary', 1); }}
                    className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
                    style={{ background: 'linear-gradient(135deg,hsl(0,90%,47%) 0%,hsl(15,90%,40%) 100%)' }}
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
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                  {/* Products */}
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50 px-4 pt-3 pb-2">
                      Commande
                    </p>
                    <div className="divide-y divide-white/8">
                      {items.map((item) => (
                        <div key={item.id} className="px-4 py-2.5 flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{item.emoji || '🍽️'}</span>
                            <span className="text-white text-sm truncate">{item.name}</span>
                            <span className="text-white/40 text-xs shrink-0">×{item.quantity}</span>
                          </div>
                          <span className="text-[hsl(0,90%,60%)] font-bold text-sm shrink-0">
                            {(item.price * item.quantity).toLocaleString('fr-FR')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-3 border-t border-white/10 flex justify-between font-bold">
                      <span className="text-white/70">Total</span>
                      <span className="text-[hsl(0,90%,60%)] text-lg">
                        {total.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>

                  {/* Client info */}
                  <div className="rounded-2xl p-4 space-y-2"
                    style={{ background: 'linear-gradient(135deg,hsl(60,3%,12%) 0%,hsl(0,3%,20%) 100%)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-3">Client</p>
                    <InfoRow label="Nom" value={form.name} />
                    <InfoRow label="Téléphone" value={form.phone} />
                    <InfoRow
                      label="Mode"
                      value={form.deliveryType === 'livraison' ? '🚗 Livraison' : '🏪 À emporter'}
                    />
                    {form.deliveryType === 'livraison' && (
                      <InfoRow label="Adresse" value={form.address} />
                    )}
                    {form.note && <InfoRow label="Note" value={form.note} />}
                  </div>

                  <p className="text-white/40 text-xs text-center px-4">
                    En confirmant, un message WhatsApp sera envoyé à la pizzeria avec votre commande.
                  </p>
                </div>

                <div className="px-5 pb-6 pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                  <button
                    onClick={handleConfirm}
                    disabled={sending}
                    className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,hsl(142,70%,35%) 0%,hsl(142,60%,28%) 100%)' }}
                  >
                    {sending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <>💬 Confirmer et envoyer sur WhatsApp</>}
                  </button>
                  <button
                    onClick={() => goTo('form', -1)}
                    className="w-full py-3 rounded-2xl border border-white/15 text-white/60 text-sm font-medium hover:border-white/30 transition"
                  >
                    Modifier mes informations
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <motion.div
                key="success"
                custom={dir}
                {...slide}
                className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                  style={{ background: 'linear-gradient(135deg,hsl(142,70%,35%) 0%,hsl(142,60%,28%) 100%)' }}
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Commande envoyée !
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-white/60 text-sm leading-relaxed"
                >
                  Votre commande a été transmise sur WhatsApp.{'\n'}
                  Nous vous recontactons très rapidement. 🍕
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ─── helper ─── */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2 text-sm">
    <span className="text-white/40 shrink-0 w-20">{label}</span>
    <span className="text-white flex-1">{value}</span>
  </div>
);

export default CartDrawer;
