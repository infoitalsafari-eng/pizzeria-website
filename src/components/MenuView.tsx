import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check } from 'lucide-react';
import { products, categories } from '@/data/products';
import { useCartStore } from '@/store/cartStore';

const MenuView = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Toutes');
  const [addedId, setAddedId] = useState<number | null>(null);
  const addItem = useCartStore(s => s.addItem);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = category === 'Toutes' || p.category === category;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && p.available;
    });
  }, [search, category]);

  const handleAdd = (p: typeof products[0]) => {
    addItem({ id: p.id, name: p.name, price: p.price, image_url: p.image_url });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 800);
  };

  return (
    <div className="pb-4 space-y-4">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl pt-2 pb-3 px-1 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une pizza..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === c
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-1">
        <AnimatePresence mode="popLayout">
          {filtered.map(p => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card overflow-hidden"
            >
              <div className="h-28 bg-gradient-to-br from-primary/15 to-secondary/10 flex items-center justify-center">
                <span className="text-4xl">{p.category === 'Boissons' ? '🥤' : p.category === 'Spéciales' && p.name === 'Tiramisu' ? '🍰' : '🍕'}</span>
              </div>
              <div className="p-3 space-y-1">
                <h3 className="font-semibold text-foreground text-sm truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-primary font-bold">{p.price.toFixed(2)} €</span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleAdd(p)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      addedId === p.id ? 'bg-success' : 'bg-primary'
                    }`}
                  >
                    {addedId === p.id ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Plus className="w-4 h-4 text-primary-foreground" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🔍</p>
          <p>Aucun résultat trouvé</p>
        </div>
      )}
    </div>
  );
};

export default MenuView;
