import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCartStore } from '@/store/cartStore';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CartDrawer = ({ open, onOpenChange }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, clearCart, itemCount } =
    useCartStore();
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[88vh] flex flex-col border-none p-0"
        style={{
          background:
            'linear-gradient(160deg, hsl(60, 3%, 9%) 0%, hsl(0, 3%, 14%) 100%)',
        }}
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/10 shrink-0">
          <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[hsl(0,90%,47%)]" />
            Mon Panier
            <span className="ml-1 text-sm font-normal text-white/50">
              ({itemCount()} article{itemCount() > 1 ? 's' : ''})
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <p className="text-5xl mb-3">🛒</p>
                <p className="text-white/50 text-sm">Votre panier est vide</p>
                <p className="text-white/30 text-xs mt-1">
                  Ajoutez des plats depuis le menu
                </p>
              </motion.div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(60,3%,12%) 0%, hsl(0,3%,20%) 100%)',
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-[hsl(0,90%,47%)]/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{item.emoji || '🍽️'}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {item.name}
                    </p>
                    <p className="text-[hsl(0,90%,60%)] font-bold text-sm">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-white/40 text-[11px]">
                        {item.price.toLocaleString('fr-FR')} × {item.quantity}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      aria-label="Diminuer"
                    >
                      <Minus className="w-3 h-3 text-white" />
                    </button>
                    <span className="w-5 text-center text-white font-bold text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                      aria-label="Augmenter"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center ml-1 hover:bg-red-500/20 transition"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {items.length > 0 && (
          <div className="px-5 pb-6 pt-3 border-t border-white/10 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Total commande</span>
              <span className="text-[hsl(0,90%,60%)] font-bold text-xl">
                {total.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="px-4 py-3 rounded-2xl border border-white/15 text-white/60 text-sm font-medium hover:border-white/30 hover:text-white/80 transition"
              >
                Vider
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-white text-sm hover:opacity-90 transition"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(0,90%,47%) 0%, hsl(15,90%,40%) 100%)',
                }}
              >
                Valider la commande →
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
