import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, X, ShoppingCart, Plus, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem, Category } from '@/data/types';
import logo from '@/assets/logo.png';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from '@/components/CartDrawer';

const EMOJI_MAP: Record<string, string> = {
  'Pizza': '🍕',
  'Restaurant': '🍽️',
  'Bar': '🍹',
  'Boutique': '🛒',
};
const getTabEmoji = (name: string) => EMOJI_MAP[name] ?? '🍴';

const Menu = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tabs, setTabs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const { addItem, updateQuantity, itemCount, items: cartItems } = useCartStore();

  useEffect(() => {
    Promise.all([
      supabase
        .from('menu_items')
        .select('*')
        .order('category')
        .order('subcategory')
        .order('name'),
      supabase
        .from('categories_pizzeria')
        .select('*')
        .is('parent_id', null)
        .order('position')
        .order('name'),
    ]).then(([menuRes, catsRes]) => {
      if (menuRes.error) setError(menuRes.error.message);
      else setItems((menuRes.data as MenuItem[]) ?? []);
      const loadedTabs = (catsRes.data as Category[]) ?? [];
      setTabs(loadedTabs);
      if (loadedTabs.length > 0) {
        setActiveTab((prev) => {
          const names = loadedTabs.map((t) => t.name);
          return names.includes(prev) ? prev : loadedTabs[0].name;
        });
      }
      setLoading(false);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<string>('Pizza');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (i.available === false) return false;
      if ((i.category ?? '') !== activeTab) return false;
      if (q && !(i.name ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, activeTab, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
      const sub = (item.subcategory && item.subcategory.trim()) ? item.subcategory : 'Autres';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(item);
      return acc;
    }, {});
  }, [filtered]);

  const getCartItem = (id: string) => cartItems.find((c) => c.id === id);
  const count = itemCount();

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)',
      }}
    >
      <div className="mx-auto max-w-md px-4 sm:px-5 py-6 text-white pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-24 h-14 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden p-1">
            <img src={logo} alt="Pizzeria Chez Moi" className="w-24 h-14 object-contain" />
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition"
            aria-label="Ouvrir le panier"
          >
            <ShoppingCart className="w-5 h-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[hsl(0,90%,47%)] text-[10px] font-bold flex items-center justify-center"
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-center mb-1"
        >
          Notre Menu
        </motion.h1>
        <p className="text-center text-xs uppercase tracking-[0.15em] text-white/90 mb-5">
          Authentique pizza italienne
        </p>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un plat…"
            className="w-full pl-9 pr-9 py-2.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              aria-label="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Main category tabs — dynamic, always visible */}
        {tabs.length > 0 && (
          <div className="-mx-4 sm:-mx-5 px-4 sm:px-5 mb-5">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tabs.map((tab) => {
                const active = activeTab === tab.name;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-2xl border text-xs font-semibold transition shrink-0 min-w-[68px] ${
                      active
                        ? 'bg-white text-neutral-900 border-white shadow-lg scale-105'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-xl leading-none">{getTabEmoji(tab.name)}</span>
                    <span className="leading-none">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-10 text-white/80">Chargement du menu…</div>
        )}

        {error && !loading && (
          <div className="text-center py-10 text-white/90">
            Impossible de charger le menu.
          </div>
        )}

        {!loading && !error && (
          <>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-white/80">
                {search.trim()
                  ? 'Aucun résultat pour cette recherche.'
                  : 'Aucun produit dans cette catégorie.'}
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(grouped).map(([subcat, list], catIdx) => (
                <motion.section
                  key={subcat}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.05, duration: 0.4 }}
                >
                  {/* Subcategory header — only show if more than one subcategory or it's named */}
                  {subcat !== 'Autres' && (
                    <h2 className="text-sm font-bold mb-3 px-1 text-white/80 uppercase tracking-wider">
                      {subcat}
                    </h2>
                  )}
                  <div className="space-y-2.5">
                    {list.map((item) => {
                      const cartItem = getCartItem(String(item.id));
                      const inCart = !!cartItem;

                      return (
                        <div
                          key={item.id ?? item.name}
                          className="rounded-2xl shadow-lg p-3"
                          style={{
                            background:
                              'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Image / Emoji */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[hsl(0,90%,47%)]/20 flex items-center justify-center overflow-hidden shrink-0">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name ?? ''}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-3xl">{item.emoji ?? '🍽️'}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-sm leading-tight">
                                {item.name ?? 'Sans nom'}
                              </p>
                              {item.description && (
                                <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              {item.price != null && (
                                <p className="text-[hsl(0,90%,60%)] font-bold text-sm mt-1">
                                  {Number(item.price).toLocaleString('fr-FR')} FCFA
                                </p>
                              )}
                            </div>

                            {/* Cart controls */}
                            <div className="shrink-0">
                              {inCart ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      updateQuantity(String(item.id), cartItem.quantity - 1)
                                    }
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                                    aria-label="Diminuer"
                                  >
                                    <Minus className="w-3 h-3 text-white" />
                                  </button>
                                  <span className="w-5 text-center text-white font-bold text-sm">
                                    {cartItem.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateQuantity(String(item.id), cartItem.quantity + 1)
                                    }
                                    className="w-7 h-7 rounded-full flex items-center justify-center transition"
                                    style={{ background: 'hsl(0,90%,47%)' }}
                                    aria-label="Augmenter"
                                  >
                                    <Plus className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    addItem({
                                      id: String(item.id),
                                      name: item.name ?? '',
                                      price: Number(item.price ?? 0),
                                      image_url: item.image_url ?? '',
                                      emoji: item.emoji ?? '🍽️',
                                    })
                                  }
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110 active:scale-95"
                                  style={{ background: 'hsl(0,90%,47%)' }}
                                  aria-label={`Ajouter ${item.name}`}
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              ))}
            </div>
          </>
        )}

        <p className="mt-10 mb-4 text-center text-[11px] text-white/70">
          © 2026 Pizzeria Chez Moi · Since 2019
        </p>
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            key="float-cart"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl font-bold text-white text-sm"
            style={{
              background: 'linear-gradient(135deg, hsl(0,90%,47%) 0%, hsl(15,90%,40%) 100%)',
              boxShadow: '0 8px 32px hsl(0,90%,47%,0.5)',
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Voir le panier</span>
            <span className="bg-white text-[hsl(0,90%,47%)] text-xs font-bold px-2 py-0.5 rounded-full">
              {count}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Menu;
