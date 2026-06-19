import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, User, UtensilsCrossed } from 'lucide-react';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/components/LoginPage';
import MenuView from '@/components/MenuView';
import CartView from '@/components/CartView';
import OrderTrackingView from '@/components/OrderTrackingView';
import ProfileView from '@/components/ProfileView';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useOrderStore } from '@/store/orderStore';

const tabs = [
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'cart', label: 'Panier', icon: ShoppingCart },
  { id: 'orders', label: 'Commandes', icon: Package },
  { id: 'profile', label: 'Profil', icon: User },
];

const PWAApp = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const isLoggedIn = useAuthStore(s => s.isLoggedIn);
  const itemCount = useCartStore(s => s.itemCount());
  const orders = useOrderStore(s => s.orders);
  const hasActiveOrder = orders.some(o => o.status !== 'delivered' && o.status !== 'cancelled');

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />;
  if (!isLoggedIn) return <LoginPage />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">
          {tabs.find(t => t.id === activeTab)?.label}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'menu' && <MenuView />}
            {activeTab === 'cart' && <CartView onNavigate={setActiveTab} />}
            {activeTab === 'orders' && <OrderTrackingView />}
            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-20">
        <div className="flex justify-around py-2">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const showBadge = tab.id === 'cart' && itemCount > 0;
            const showPulse = tab.id === 'orders' && hasActiveOrder;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 py-1 px-3 relative"
              >
                <div className="relative">
                  <tab.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                  {showPulse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full animate-pulse-glow" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
};

export default PWAApp;
