import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CircleDot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface HeureItem {
  id: string | null;
  dayname: string | null;
  started: string | null;
  ending: string | null;
}

const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const Heurs = () => {
  const [items, setItems] = useState<HeureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('heures_pizzeria')
      .select('id, dayname, started, ending')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else {
          const sorted = (data ?? []).sort(
            (a, b) => DAY_ORDER.indexOf(a.dayname ?? '') - DAY_ORDER.indexOf(b.dayname ?? ''),
          );
          setItems(sorted as HeureItem[]);
        }
        setLoading(false);
      });
  }, []);

  // SEO
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Nos heures d\u2019ouverture \u2013 Pizzeria Chez Moi Garoua';

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const description =
      'D\u00e9couvrez les horaires d\u2019ouverture de la Pizzeria Chez Moi \u00e0 Garoua. Ouvert 7j/7 de 08H00 \u00e0 23H00.';
    setMeta('description', description);
    setMeta('og:title', 'Nos heures \u2013 Pizzeria Chez Moi', 'property');
    setMeta('og:description', description, 'property');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/heurs`;

    return () => {
      document.title = prevTitle;
    };
  }, []);

  // Today detection (Dimanche=0 ... Samedi=6)
  const weekIndexByName: Record<string, number> = {
    Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3,
    Jeudi: 4, Vendredi: 5, Samedi: 6,
  };
  const todayIdx = new Date().getDay();

  // Parse "08H00" -> minutes since midnight
  const toMinutes = (s?: string | null) => {
    if (!s) return null;
    const m = s.toUpperCase().replace(/\s/g, '').match(/^(\d{1,2})H(\d{0,2})$/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10);
  };

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayItem = items.find((i) => weekIndexByName[i.dayname ?? ''] === todayIdx);
  const startMin = toMinutes(todayItem?.started);
  const endMin = toMinutes(todayItem?.ending);
  const isOpen =
    startMin !== null && endMin !== null
      ? endMin > startMin
        ? nowMin >= startMin && nowMin < endMin
        : nowMin >= startMin || nowMin < endMin
      : false;

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
          Nos heures
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center text-xs uppercase tracking-[0.18em] text-white/80 mb-5"
        >
          Ouvert toute la semaine
        </motion.p>

        {/* Status today */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 rounded-2xl p-4 flex items-center gap-3 shadow-xl"
          style={{
            background:
              'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
          }}
        >
          <div className="relative">
            <span
              className={`absolute inset-0 rounded-full ${isOpen ? 'bg-green-500/40' : 'bg-red-500/40'} animate-ping`}
            />
            <CircleDot className={`w-6 h-6 relative ${isOpen ? 'text-green-400' : 'text-red-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">
              {isOpen ? 'Ouvert maintenant' : 'Ferm\u00e9 actuellement'}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {todayItem?.dayname ?? "Aujourd\u2019hui"} · {todayItem?.started} \u2013 {todayItem?.ending}
            </p>
          </div>
          <Clock className="w-5 h-5 text-primary" />
        </motion.div>

        {loading && (
          <div className="text-center py-10 text-white/80">Chargement\u2026</div>
        )}

        {error && !loading && (
          <div className="text-center py-10 text-white/90">
            Impossible de charger les donn\u00e9es.
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-10 text-white/80">
            Aucune donn\u00e9e disponible pour le moment.
          </div>
        )}

        <div className="space-y-2.5">
          {items.map((item, idx) => {
            const isToday = weekIndexByName[item.dayname ?? ''] === todayIdx;
            return (
              <motion.div
                key={`${item.dayname}-${idx}`}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + idx * 0.05, duration: 0.35 }}
                className={`relative rounded-2xl shadow-lg flex items-center gap-3 px-4 py-3 overflow-hidden ${
                  isToday ? 'ring-2 ring-primary' : ''
                }`}
                style={{
                  background: isToday
                    ? 'linear-gradient(135deg, hsl(15, 90%, 47%) 0%, hsl(0, 60%, 30%) 100%)'
                    : 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
                }}
              >
                {isToday && (
                  <span className="absolute top-1 right-2 text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-1.5 py-0.5 rounded-full">
                    Aujourd\u2019hui
                  </span>
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    isToday ? 'bg-white/20' : 'bg-primary/30'
                  }`}
                >
                  {(item.dayname ?? '?').slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white leading-tight">
                    {item.dayname ?? 'Sans nom'}
                  </p>
                  <p className="text-[11px] text-white/70 leading-tight">
                    Service continu
                  </p>
                </div>
                {item.started && item.ending && (
                  <div className="flex items-center gap-1.5 text-white font-bold whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span className="tabular-nums text-sm">
                      {item.started} \u2013 {item.ending}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 mb-4 text-center text-[11px] text-white/70">
          \u00a9 2026 Pizzeria Chez Moi · Since 2019
        </p>
      </div>
    </div>
  );
};

export default Heurs;
