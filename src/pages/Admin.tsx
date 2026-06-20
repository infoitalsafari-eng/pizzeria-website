import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, UtensilsCrossed, Clock, Phone, Package, ChevronRight } from 'lucide-react';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useApiService } from '@/services/apiService';
import logo from '@/assets/logo.png';

interface MenuItem { id: string; name: string | null; }
interface HeureItem { id: string; dayname: string | null; }
interface OrderItem { id: string; status: string | null; }

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
  const { isAdminLoggedIn, logout } = useAdminAuthStore();
  const navigate = useNavigate();

  const { data: menu, loading: menuLoading } = useApiService<MenuItem>('pizzas');
  const { data: heures, loading: heuresLoading } = useApiService<HeureItem>('heures-pizzeria');
  const { data: orders, loading: ordersLoading } = useApiService<OrderItem>('orders-pizzeria');

  useEffect(() => {
    if (!isAdminLoggedIn) navigate('/admin/login', { replace: true });
  }, [isAdminLoggedIn, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAdminLoggedIn) return null;

  const activeOrders = orders?.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ) ?? [];

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)' }}
    >
      <div className="mx-auto max-w-md px-5 py-6">
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

        <div className="space-y-3">
          <Link to="/menu" className="block">
            <StatCard
              icon={<UtensilsCrossed className="w-5 h-5 text-white" />}
              label="Pizzas au menu"
              count={menuLoading ? '…' : (menu?.length ?? 0)}
              color="bg-primary/60"
              delay={0.2}
            />
          </Link>

          <Link to="/heurs" className="block">
            <StatCard
              icon={<Clock className="w-5 h-5 text-white" />}
              label="Jours configurés"
              count={heuresLoading ? '…' : (heures?.length ?? 0)}
              color="bg-orange-600/60"
              delay={0.25}
            />
          </Link>

          <StatCard
            icon={<Package className="w-5 h-5 text-white" />}
            label="Commandes actives"
            count={ordersLoading ? '…' : activeOrders.length}
            color="bg-yellow-600/60"
            delay={0.3}
          />

          <StatCard
            icon={<Phone className="w-5 h-5 text-white" />}
            label="Informations restaurant"
            count="→"
            color="bg-green-700/60"
            delay={0.35}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
        >
          <p className="text-white font-semibold text-sm mb-1">Accès rapide</p>
          <p className="text-white/50 text-xs mb-4">Naviguer vers les sections du site</p>
          <div className="flex flex-wrap gap-2">
            {[
              { to: '/menu', label: 'Menu' },
              { to: '/heurs', label: 'Heures' },
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
