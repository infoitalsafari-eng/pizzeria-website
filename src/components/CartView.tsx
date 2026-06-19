import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, Check } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';

interface CartViewProps {
  onNavigate?: (tab: string) => void;
}

const CartView = ({ onNavigate }: CartViewProps) => {
  const { items, deliveryType, address, updateQuantity, removeItem, setDeliveryType, setAddress, clearCart, total, itemCount } = useCartStore();
  const addOrder = useOrderStore(s => s.addOrder);
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 2.99 : 0;

  const handleOrder = () => {
    addOrder({
      id: Date.now(),
      status: 'received',
      status_label: 'Commande reçue',
      created_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 45 * 60000).toISOString(),
      items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      total: total(),
      tracking_steps: [
        { step: 'received', label: 'Commande reçue', done: true, time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
        { step: 'in_preparation', label: 'En préparation', done: false, time: null },
        { step: 'out_for_delivery', label: 'En livraison', done: false, time: null },
        { step: 'delivered', label: 'Livrée', done: false, time: null },
      ],
    });
    setConfirmed(true);
    setTimeout(() => {
      clearCart();
      setShowCheckout(false);
      setConfirmed(false);
      onNavigate?.('orders');
    }, 2000);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          setAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
        } catch {
          setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  if (items.length === 0 && !confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <p className="text-6xl mb-4">🛒</p>
        <p className="text-lg font-medium">Votre panier est vide</p>
        <p className="text-sm">Ajoutez des pizzas depuis le menu !</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-success flex items-center justify-center mb-4"
        >
          <Check className="w-10 h-10 text-success-foreground" />
        </motion.div>
        <p className="text-xl font-bold text-foreground">Commande confirmée !</p>
        <p className="text-muted-foreground text-sm mt-1">Redirection vers le suivi...</p>
      </div>
    );
  }

  if (showCheckout) {
    return (
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Finaliser la commande</h2>
        
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Récapitulatif</h3>
          {items.map(i => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{i.quantity}x {i.name}</span>
              <span className="text-foreground">{(i.price * i.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{total().toFixed(2)} €</span>
          </div>
        </div>

        {deliveryType === 'delivery' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Adresse de livraison</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="12 Rue de la Paix, Paris"
                className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <button
                onClick={handleGeolocate}
                disabled={geoLoading}
                className="px-3 py-3 bg-card border border-border rounded-xl text-foreground hover:border-primary transition-colors flex-shrink-0"
                title="Utiliser ma position"
              >
                {geoLoading ? (
                  <span className="w-5 h-5 block border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-lg">📍</span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Paiement</label>
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-7 bg-gradient-to-r from-primary to-secondary rounded" />
            <span className="text-sm text-muted-foreground">•••• •••• •••• 4242</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 border border-border rounded-xl text-foreground font-medium">
            Retour
          </button>
          <button onClick={handleOrder} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:scale-[1.02] transition-transform">
            Confirmer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-foreground">Mon Panier ({itemCount()})</h2>

      <div className="space-y-3">
        {items.map(item => (
          <motion.div
            key={item.id}
            layout
            className="glass-card p-3 flex items-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🍕</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">{item.name}</h3>
              <p className="text-primary font-bold text-sm">{(item.price * item.quantity).toFixed(2)} €</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Minus className="w-3 h-3 text-foreground" />
              </button>
              <span className="text-foreground font-medium w-5 text-center text-sm">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                <Plus className="w-3 h-3 text-foreground" />
              </button>
              <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center ml-1">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delivery toggle */}
      <div className="glass-card p-1 flex rounded-xl">
        <button
          onClick={() => setDeliveryType('delivery')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${deliveryType === 'delivery' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          🚗 Livraison
        </button>
        <button
          onClick={() => setDeliveryType('pickup')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${deliveryType === 'pickup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          🏪 Retrait
        </button>
      </div>

      {/* Summary */}
      <div className="glass-card p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="text-foreground">{subtotal.toFixed(2)} €</span>
        </div>
        {deliveryType === 'delivery' && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-foreground">{deliveryFee.toFixed(2)} €</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-primary">{total().toFixed(2)} €</span>
        </div>
      </div>

      <button
        onClick={() => setShowCheckout(true)}
        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl text-lg glow-primary hover:scale-[1.02] transition-transform"
      >
        Commander • {total().toFixed(2)} €
      </button>
    </div>
  );
};

export default CartView;
