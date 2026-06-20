import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, UtensilsCrossed, Clock, Phone, Package, ChevronRight, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const StatCard = ({
  icon, label, count, color, delay,
}: {
  icon: React.ReactNode; label: string; count: number | string; color: string; delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="rounded-2xl p-4 flex items-center gap-3"
    style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-bold text-lg leading-none">{count}</p>
      <p className="text-white/60 text-xs mt-0.5">{label}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-white/30" />
  </motion.div>
);

const Admin = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [menuCount, setMenuCount] = useState<number | null>(null);
  const [heuresCount, setHeuresCount] = useState<number | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login', { replace: true });
      } else {
        setReady(true);
        loadCounts();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCounts = async () => {
    const [menuRes, heuresRes, ordersRes] = await Promise.all([
      supabase.from('menu_items').select('*', { count: 'exact', head: true }),
      supabase.from('heures_pizzeria').select('*', { count: 'exact', head: true }),
      supabase
        .from('orders_pizzeria')
        .select('id', { count: 'exact', head: true })
        .not('status', 'in', '("delivered","cancelled")'),
    ]);
    setMenuCount(menuRes.count ?? 0);
    setHeuresCount(heuresRes.count ?? 0);
    setActiveOrdersCount(ordersRes.count ?? 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!ready) return null;

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)' }}
    >
      <div className="mx-auto max-w-md px-5 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center p-0.5">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Administration</p>
              <p className="text-white/70 text-[10px]">Pizzeria Chez Moi</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-white text-xl font-bold mb-1"
        >
          Tableau de bord
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-white/70 text-xs mb-6"
        >
          Vue d'ensemble de votre restaurant
        </motion.p>

        {/* Stats */}
        <div className="space-y-3 mb-8">
          <Link to="/admin/menu" className="block">
            <StatCard
              icon={<UtensilsCrossed className="w-5 h-5 text-white" />}
              label="Produits au menu"
              count={menuCount === null ? '…' : menuCount}
              color="bg-primary/60"
              delay={0.2}
            />
          </Link>

          <Link to="/admin/heures" className="block">
            <StatCard
              icon={<Clock className="w-5 h-5 text-white" />}
              label="Jours configurés"
              count={heuresCount === null ? '…' : heuresCount}
              color="bg-orange-600/60"
              delay={0.25}
            />
          </Link>

          <StatCard
            icon={<Package className="w-5 h-5 text-white" />}
            label="Commandes actives"
            count={activeOrdersCount === null ? '…' : activeOrdersCount}
            color="bg-yellow-600/60"
            delay={0.3}
          />

          <Link to="/admin/informations" className="block">
            <StatCard
              icon={<Phone className="w-5 h-5 text-white" />}
              label="Informations restaurant"
              count="→"
              color="bg-green-700/60"
              delay={0.35}
            />
          </Link>
        </div>

        {/* Management links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-primary" />
            <p className="text-white font-semibold text-sm">Gestion</p>
          </div>
          <div className="space-y-2">
            {[
              { to: '/admin/menu', label: 'Gérer le menu', desc: 'Ajouter, modifier, supprimer des produits', color: 'bg-primary/20 hover:bg-primary/30' },
              { to: '/admin/heures', label: 'Gérer les horaires', desc: "Modifier les heures d'ouverture", color: 'bg-orange-600/20 hover:bg-orange-600/30' },
              { to: '/admin/informations', label: 'Gérer les informations', desc: 'Instagram, WhatsApp, téléphone, Maps', color: 'bg-green-700/20 hover:bg-green-700/30' },
            ].map(({ to, label, desc, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition ${color}`}
              >
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-white/50 text-xs">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 shrink-0" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Public links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
        >
          <p className="text-white font-semibold text-sm mb-1">Accès rapide</p>
          <p className="text-white/50 text-xs mb-4">Pages publiques du site</p>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/menu', label: 'Menu public' },
              { to: '/heurs', label: 'Horaires publics' },
              { to: '/', label: 'Accueil' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="bg-white/10 hover:bg-primary/40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>

        <p className="mt-8 text-center text-[10px] text-white/40">
          © 2026 Pizzeria Chez Moi · Admin
        </p>
      </div>
    </div>
  );
};

export default Admin;
