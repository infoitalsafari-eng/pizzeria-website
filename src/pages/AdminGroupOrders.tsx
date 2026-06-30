import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Calendar, Phone, User, Package, History, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Link } from 'react-router-dom';

interface City {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  city_id: string;
  delivery_date: string;
}

interface GroupOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

interface GroupOrder {
  id: string;
  slot_id: string;
  client_name: string;
  client_phone: string;
  items: GroupOrderItem[];
  total: number;
  status: string;
  created_at: string;
  delivered_at: string | null;
}

type TabView = 'pending' | 'delivered';

const AdminGroupOrders = () => {
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>('pending');
  const [delivering, setDelivering] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [ordersRes, citiesRes, slotsRes] = await Promise.all([
      supabase.from('group_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('group_order_cities').select('id, name'),
      supabase.from('group_order_slots').select('id, city_id, delivery_date'),
    ]);
    if (ordersRes.error) toast.error('Erreur commandes : ' + ordersRes.error.message);
    else setOrders((ordersRes.data as GroupOrder[]) ?? []);
    if (!citiesRes.error) setCities((citiesRes.data as City[]) ?? []);
    if (!slotsRes.error) setSlots((slotsRes.data as Slot[]) ?? []);
    setLoading(false);
  };

  const markDelivered = async (orderId: string) => {
    setDelivering(orderId);
    const { error } = await supabase
      .from('group_orders')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'delivered', delivered_at: new Date().toISOString() }
            : o,
        ),
      );
      toast.success('Livraison validée ✅');
    }
    setDelivering(null);
  };

  const getCityName = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    const city = slot ? cities.find((c) => c.id === slot.city_id) : null;
    return city?.name ?? '–';
  };

  const getDeliveryDate = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return '–';
    return new Date(slot.delivery_date + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'long',
    });
  };

  const filteredOrders = orders.filter((o) =>
    tab === 'pending' ? o.status === 'pending' : o.status === 'delivered',
  );

  /* Group pending orders by city then by date */
  type GroupKey = string;
  const groupedOrders = filteredOrders.reduce<Record<GroupKey, GroupOrder[]>>((acc, order) => {
    const slot = slots.find((s) => s.id === order.slot_id);
    const city = slot ? cities.find((c) => c.id === slot?.city_id) : null;
    const key = `${city?.name ?? '?'}__${slot?.delivery_date ?? '?'}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedOrders).sort(([a], [b]) => {
    const [cityA, dateA] = a.split('__');
    const [cityB, dateB] = b.split('__');
    return cityA.localeCompare(cityB, 'fr') || dateA.localeCompare(dateB);
  });

  return (
    <AdminLayout title="Commandes groupées" subtitle="Tableau récapitulatif par ville et date">

      {/* Header actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'pending' ? 'bg-amber-400 text-neutral-900' : 'text-white/60 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            En cours
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === 'pending' ? 'bg-neutral-900/30' : 'bg-amber-400/20 text-amber-400'}`}>
                {orders.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('delivered')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'delivered' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historique
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            title="Actualiser"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white/60" />
          </button>
          <Link
            to="/admin/group-orders/config"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 text-xs font-medium transition"
          >
            ⚙️ Config
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="text-center py-14 text-white/40 text-sm">
          {tab === 'pending'
            ? 'Aucune commande groupée en attente.'
            : 'Aucune commande livrée dans l\'historique.'}
        </div>
      )}

      {!loading && sortedGroups.length > 0 && (
        <div className="space-y-5">
          {sortedGroups.map(([key, groupOrders]) => {
            const [cityName, dateStr] = key.split('__');
            const groupTotal = groupOrders.reduce((s, o) => s + Number(o.total), 0);

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, hsl(60,3%,7%) 0%, hsl(0,3%,19%) 100%)' }}
              >
                {/* Group header */}
                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-white font-bold text-sm">{cityName}</span>
                  </div>
                  <span className="text-white/30">·</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-white/80 text-sm">
                      {dateStr !== '?' ? new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '–'}
                    </span>
                  </div>
                  <span className="ml-auto text-amber-400 font-bold text-sm">
                    {groupTotal.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-white/30 text-xs">({groupOrders.length} cmd)</span>
                </div>

                {/* Orders in this group */}
                <div className="divide-y divide-white/[0.05]">
                  {groupOrders.map((order) => (
                    <div key={order.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <User className="w-3 h-3 text-white/40 shrink-0" />
                            <span className="text-white text-sm font-semibold">{order.client_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-white/40 shrink-0" />
                            <span className="text-white/60 text-xs">{order.client_phone}</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-amber-400 font-bold text-sm">
                            {Number(order.total).toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-white/30 text-[10px]">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-0.5 mb-3">
                        {(order.items as GroupOrderItem[]).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-xs shrink-0">{item.emoji}</span>
                            <span className="text-white/60 text-xs flex-1 truncate">
                              {item.quantity}× {item.name}
                            </span>
                            <span className="text-white/40 text-xs shrink-0">
                              {(item.price * item.quantity).toLocaleString('fr-FR')} F
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action */}
                      {tab === 'pending' && (
                        <button
                          onClick={() => markDelivered(order.id)}
                          disabled={delivering === order.id}
                          className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-60"
                          style={{ background: 'hsl(142,60%,28%,0.3)', border: '1px solid hsl(142,60%,35%,0.4)' }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Livraison validée</span>
                        </button>
                      )}

                      {tab === 'delivered' && order.delivered_at && (
                        <p className="text-white/30 text-[10px] text-right">
                          Livré le {new Date(order.delivered_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGroupOrders;
