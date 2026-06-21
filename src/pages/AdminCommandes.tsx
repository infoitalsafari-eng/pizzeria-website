import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, X, Package } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  emoji?: string;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  delivery_type: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  delivered: 'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'delivered', label: 'Livrées' },
  { key: 'cancelled', label: 'Annulées' },
];

const STATUS_ACTIONS: Record<string, { key: string; label: string }[]> = {
  pending: [
    { key: 'confirmed', label: 'Confirmer' },
    { key: 'cancelled', label: 'Annuler' },
  ],
  confirmed: [
    { key: 'delivered', label: 'Marquer livrée' },
    { key: 'cancelled', label: 'Annuler' },
  ],
  delivered: [],
  cancelled: [{ key: 'pending', label: 'Remettre en attente' }],
};

const AdminCommandes = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders_pizzeria')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erreur de chargement : ' + error.message);
    } else {
      setOrders((data as Order[]) ?? []);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from('orders_pizzeria')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o,
        ),
      );
      toast.success('Statut mis à jour');
    }
    setUpdatingId(null);
  };

  const filtered = orders.filter((o) => {
    const tabOk = activeTab === 'all' || o.status === activeTab;
    const q = search.trim().toLowerCase();
    const searchOk =
      !q ||
      (o.customer_name ?? '').toLowerCase().includes(q) ||
      (o.phone ?? '').includes(q);
    return tabOk && searchOk;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }) +
      ' · ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <AdminLayout
      title="Commandes"
      subtitle={
        loading
          ? 'Chargement…'
          : `${orders.length} commande${orders.length > 1 ? 's' : ''} au total`
      }
    >
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              activeTab === tab.key
                ? 'bg-white text-neutral-900 border-white shadow'
                : 'bg-white/10 text-white border-white/25 hover:bg-white/20'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({orders.filter((o) => o.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou téléphone…"
          className="w-full bg-white/10 border border-white/15 text-white placeholder:text-white/40 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-white/40 transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-14 text-white/60 text-sm">
          Chargement des commandes…
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-14">
          <Package className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 text-sm">
            {orders.length === 0
              ? 'Aucune commande pour le moment'
              : 'Aucune commande pour ce filtre'}
          </p>
        </div>
      )}

      {/* Orders list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const items = Array.isArray(order.items) ? order.items : [];
            const actions = STATUS_ACTIONS[order.status] ?? [];

            return (
              <div
                key={order.id}
                className="rounded-2xl overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
                }}
              >
                {/* Summary row — clickable */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                  onClick={() =>
                    setExpandedId(expanded ? null : order.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">
                        {order.customer_name || '—'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          STATUS_COLORS[order.status] ?? STATUS_COLORS.pending
                        }`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-white/50 text-xs">
                        {formatDate(order.created_at)}
                      </span>
                      <span className="text-white/40 text-xs">{order.phone}</span>
                      <span className="text-white/40 text-xs">
                        {order.delivery_type === 'livraison'
                          ? '🚗 Livraison'
                          : '🏠 À emporter'}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-white font-bold text-sm">
                      {(order.total ?? 0).toLocaleString('fr-FR')} FCFA
                    </p>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-white/40 mt-1 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/40 mt-1 ml-auto" />
                    )}
                  </div>
                </button>

                {/* Detail panel */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/[0.08] pt-3 space-y-4">
                        {/* Products */}
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-semibold">
                            Produits commandés
                          </p>
                          <div className="space-y-1.5">
                            {items.length === 0 && (
                              <p className="text-white/40 text-xs">—</p>
                            )}
                            {items.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="text-white text-sm">
                                  {item.emoji && (
                                    <span className="mr-1">{item.emoji}</span>
                                  )}
                                  {item.quantity}× {item.name}
                                </span>
                                <span className="text-white/60 text-sm shrink-0">
                                  {(
                                    (item.price ?? 0) * item.quantity
                                  ).toLocaleString('fr-FR')}{' '}
                                  FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-2.5 pt-2.5 border-t border-white/10">
                            <span className="text-white/60 text-sm">Total</span>
                            <span className="text-white font-bold text-sm">
                              {(order.total ?? 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>

                        {/* Client info */}
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-semibold">
                            Informations client
                          </p>
                          <div className="space-y-1">
                            <p className="text-white/80 text-sm">
                              📞 {order.phone || '—'}
                            </p>
                            {order.delivery_type === 'livraison' &&
                              order.delivery_address && (
                                <p className="text-white/80 text-sm">
                                  📍 {order.delivery_address}
                                </p>
                              )}
                            {order.notes && (
                              <p className="text-white/80 text-sm">
                                📝 {order.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status actions */}
                        {actions.length > 0 && (
                          <div>
                            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 font-semibold">
                              Changer le statut
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {actions.map((action) => (
                                <button
                                  key={action.key}
                                  onClick={() =>
                                    updateStatus(order.id, action.key)
                                  }
                                  disabled={updatingId === order.id}
                                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${
                                    action.key === 'cancelled'
                                      ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30'
                                      : action.key === 'delivered'
                                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border-green-500/30'
                                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30'
                                  }`}
                                >
                                  {updatingId === order.id ? '…' : action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCommandes;
