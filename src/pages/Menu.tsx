import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { menuItems } from '@/data/menuPizzeria';
import type { MenuItem } from '@/data/types';
import logo from '@/assets/logo.png';

const Menu = () => {
  const items: MenuItem[] = menuItems;

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category ?? 'Autres'));
    return ['Tout', ...Array.from(set)];
  }, [items]);

  const [activeCat, setActiveCat] = useState<string>('Tout');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      const catOk = activeCat === 'Tout' || (i.category ?? 'Autres') === activeCat;
      const sOk = !q || (i.name ?? '').toLowerCase().includes(q);
      return catOk && sOk;
    });
  }, [items, activeCat, search]);

  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, MenuItem[]>>((acc, item) => {
        const cat = item.category ?? 'Autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {}),
    [filtered],
  );

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)',
      }}
    >
      <div className="mx-auto max-w-md px-5 py-6 text-white">
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
          <div className="w-9" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-center mb-1"
        >
          Notre Menu
        </motion.h1>
        <p className="text-center text-xs uppercase tracking-[0.15em] text-white/90 mb-6">
          Authentique pizza italienne
        </p>

        {/* Search bar */}
        <div className="relative mb-4">
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

        {/* Category pagination */}
        <div className="-mx-5 px-5 mb-5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 w-max">
            {categories.map((cat) => {
              const active = activeCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCat(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                    active
                      ? 'bg-white text-neutral-900 border-white shadow'
                      : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-10 text-white/80">
            Aucun résultat.
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(grouped).map(([category, list], catIdx) => (
            <motion.section
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIdx * 0.1, duration: 0.5 }}
            >
              <h2 className="text-lg font-bold mb-3 px-1">{category}</h2>
              <div className="space-y-3">
                {list.map((item, idx) => (
                  <motion.div
                    key={item.id ?? `${category}-${idx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.1 + idx * 0.05, duration: 0.4 }}
                    className="rounded-2xl shadow-lg flex items-center gap-3 p-3"
                    style={{
                      background:
                        'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
                    }}
                  >
                    <div className="w-16 h-16 rounded-xl bg-primary/30 flex items-center justify-center overflow-hidden shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-white leading-tight truncate">
                          {item.name ?? 'Sans nom'}
                        </p>
                        {item.price != null && (
                          <span className="text-primary font-bold whitespace-nowrap">
                            {Number(item.price).toLocaleString('fr-FR')} FCFA
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      {item.available === false && (
                        <p className="text-xs text-red-300 mt-1">Indisponible</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <p className="mt-10 mb-4 text-center text-[11px] text-white/70">
          © 2026 Pizzeria Chez Moi · Since 2019
        </p>
      </div>
    </div>
  );
};

export default Menu;