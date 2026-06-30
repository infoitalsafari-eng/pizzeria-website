import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, MapPin, Calendar, Phone, User, Package, History, RefreshCw, Share2, Copy, MessageCircle, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
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

interface ExportSummary {
  cityName: string;
  dateLabel: string;
  items: { emoji: string; name: string; qty: number; total: number }[];
  clients: { name: string; phone: string; orderTotal: number }[];
  grandTotal: number;
  orderCount: number;
}

const AdminGroupOrders = () => {
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabView>('pending');
  const [delivering, setDelivering] = useState<string | null>(null);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);

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

  const buildGroupSummary = (groupOrders: GroupOrder[], cityName: string, dateStr: string): ExportSummary => {
    const itemMap: Record<string, { emoji: string; name: string; qty: number; total: number }> = {};
    for (const order of groupOrders) {
      for (const item of order.items as GroupOrderItem[]) {
        if (!itemMap[item.name]) {
          itemMap[item.name] = { emoji: item.emoji, name: item.name, qty: 0, total: 0 };
        }
        itemMap[item.name].qty += item.quantity;
        itemMap[item.name].total += item.price * item.quantity;
      }
    }
    const dateLabel = dateStr !== '?'
      ? new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '–';
    return {
      cityName,
      dateLabel,
      items: Object.values(itemMap).sort((a, b) => b.qty - a.qty),
      clients: groupOrders.map((o) => ({ name: o.client_name, phone: o.client_phone, orderTotal: Number(o.total) })),
      grandTotal: groupOrders.reduce((s, o) => s + Number(o.total), 0),
      orderCount: groupOrders.length,
    };
  };

  const formatSummaryText = (s: ExportSummary): string => {
    const lines: string[] = [];
    lines.push(`📦 Résumé livraison groupée`);
    lines.push(`📍 ${s.cityName} — ${s.dateLabel}`);
    lines.push(`👥 ${s.orderCount} commande${s.orderCount > 1 ? 's' : ''}`);
    lines.push('');
    lines.push('🛒 Articles consolidés :');
    for (const item of s.items) {
      lines.push(`  ${item.emoji} ${item.name} × ${item.qty}  →  ${item.total.toLocaleString('fr-FR')} FCFA`);
    }
    lines.push('');
    lines.push('👤 Clients :');
    for (const c of s.clients) {
      lines.push(`  • ${c.name} (${c.phone}) — ${c.orderTotal.toLocaleString('fr-FR')} FCFA`);
    }
    lines.push('');
    lines.push(`💰 Total : ${s.grandTotal.toLocaleString('fr-FR')} FCFA`);
    return lines.join('\n');
  };

  const handleCopy = async (s: ExportSummary) => {
    try {
      await navigator.clipboard.writeText(formatSummaryText(s));
      toast.success('Résumé copié dans le presse-papiers ✅');
    } catch {
      toast.error('Impossible de copier.');
    }
  };

  const handleWhatsApp = (s: ExportSummary) => {
    const text = encodeURIComponent(formatSummaryText(s));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = async (s: ExportSummary) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const bottomMargin = 18;
    const maxY = pageH - bottomMargin;
    const usableW = pageW - margin * 2;
    let y = 16;

    const accent: [number, number, number] = [245, 166, 35];
    const dark: [number, number, number] = [26, 26, 26];
    const muted: [number, number, number] = [100, 100, 100];
    const light: [number, number, number] = [240, 240, 240];

    const colArticle = margin;
    const colQty = pageW - margin - 44;
    const colTotal = pageW - margin;
    const colName = margin;
    const colPhone = margin + usableW * 0.55;
    const colAmount = pageW - margin;

    const needsPage = (requiredSpace: number) => {
      if (y + requiredSpace > maxY) {
        doc.addPage();
        y = 14;
        return true;
      }
      return false;
    };

    const drawItemsHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text('Article', colArticle, y);
      doc.text('Qte', colQty, y, { align: 'right' });
      doc.text('Sous-total', colTotal, y, { align: 'right' });
      y += 3;
      doc.setDrawColor(...dark);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    };

    const drawClientsHeader = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text('Nom', colName, y);
      doc.text('Telephone', colPhone, y);
      doc.text('Montant', colAmount, y, { align: 'right' });
      y += 3;
      doc.setDrawColor(...dark);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
    };

    doc.setFontSize(18);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text('Resume livraison groupee', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text(`${s.cityName}  |  ${s.dateLabel}  |  ${s.orderCount} commande${s.orderCount > 1 ? 's' : ''}`, margin, y);
    y += 10;

    doc.setDrawColor(...light);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...muted);
    doc.text('ARTICLES CONSOLIDES', margin, y);
    y += 5;

    drawItemsHeader();

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    for (const item of s.items) {
      needsPage(10);
      const name = item.name.length > 55 ? item.name.slice(0, 52) + '...' : item.name;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...dark);
      doc.text(name, colArticle, y);
      doc.text(`x ${item.qty}`, colQty, y, { align: 'right' });
      doc.text(`${item.total.toLocaleString('fr-FR')} FCFA`, colTotal, y, { align: 'right' });
      y += 5.5;
    }

    needsPage(16);
    doc.setDrawColor(...light);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.setFontSize(9);
    doc.text('Total general', colArticle, y);
    doc.text(`${s.grandTotal.toLocaleString('fr-FR')} FCFA`, colTotal, y, { align: 'right' });
    y += 10;

    needsPage(20);
    doc.setDrawColor(...light);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...muted);
    doc.text('CLIENTS', margin, y);
    y += 5;

    drawClientsHeader();

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    for (const c of s.clients) {
      needsPage(10);
      const name = c.name.length > 40 ? c.name.slice(0, 37) + '...' : c.name;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...dark);
      doc.text(name, colName, y);
      doc.text(c.phone, colPhone, y);
      doc.text(`${c.orderTotal.toLocaleString('fr-FR')} FCFA`, colAmount, y, { align: 'right' });
      y += 5.5;
    }

    needsPage(14);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Genere le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      pageW / 2,
      y,
      { align: 'center' },
    );

    const filename = `livraison-${s.cityName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;

    if (navigator.share) {
      try {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Résumé livraison – ${s.cityName}`,
          });
          return;
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    doc.save(filename);
    toast.success('PDF téléchargé avec succès.');
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
                  <button
                    onClick={() => setExportSummary(buildGroupSummary(groupOrders, cityName, dateStr))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-400 text-[11px] font-semibold transition"
                    title="Exporter le résumé par groupe"
                  >
                    <Share2 className="w-3 h-3" />
                    Exporter
                  </button>
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
      {/* Export summary modal */}
      <AnimatePresence>
        {exportSummary && (
          <motion.div
            key="export-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setExportSummary(null)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: 'hsl(0,3%,12%)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
                <div>
                  <p className="text-white font-bold text-sm">Résumé du groupe</p>
                  <p className="text-white/50 text-xs">{exportSummary.cityName} · {exportSummary.dateLabel}</p>
                </div>
                <button
                  onClick={() => setExportSummary(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                >
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>

              {/* Consolidated items */}
              <div className="px-4 py-3 border-b border-white/[0.08]">
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Articles consolidés ({exportSummary.orderCount} cmd)
                </p>
                <div className="space-y-1.5">
                  {exportSummary.items.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="text-sm shrink-0">{item.emoji}</span>
                      <span className="text-white text-xs flex-1">{item.name}</span>
                      <span className="text-amber-400 font-bold text-xs shrink-0">× {item.qty}</span>
                      <span className="text-white/40 text-xs shrink-0 ml-1">{item.total.toLocaleString('fr-FR')} F</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex justify-between">
                  <span className="text-white/50 text-xs">Total</span>
                  <span className="text-amber-400 font-bold text-sm">{exportSummary.grandTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {/* Client list */}
              <div className="px-4 py-3 border-b border-white/[0.08]">
                <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-2">Clients</p>
                <div className="space-y-1">
                  {exportSummary.clients.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-white text-xs flex-1 truncate">{c.name}</span>
                      <span className="text-white/40 text-xs shrink-0">{c.phone}</span>
                      <span className="text-white/60 text-xs shrink-0 ml-1">{c.orderTotal.toLocaleString('fr-FR')} F</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => handleCopy(exportSummary)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier
                </button>
                <button
                  onClick={() => handleWhatsApp(exportSummary)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(37,211,102,0.18)', color: 'rgb(37,211,102)', border: '1px solid rgba(37,211,102,0.3)' }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
                <button
                  onClick={() => handlePrint(exportSummary)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition"
                  style={{ background: 'rgba(251,191,36,0.15)', color: 'rgb(251,191,36)', border: '1px solid rgba(251,191,36,0.3)' }}
                >
                  {navigator.share ? (
                    <><Share2 className="w-3.5 h-3.5" />Partager</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" />Télécharger PDF</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminGroupOrders;
