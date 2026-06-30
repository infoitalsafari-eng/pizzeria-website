import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, ToggleLeft, ToggleRight, Calendar, MapPin, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';

interface City {
  id: string;
  name: string;
  active: boolean;
  position: number;
}

interface Slot {
  id: string;
  city_id: string;
  delivery_date: string;
  active: boolean;
}

const AdminGroupOrdersConfig = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [addingCity, setAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  const [addingSlotForCity, setAddingSlotForCity] = useState<string | null>(null);
  const [newSlotDate, setNewSlotDate] = useState('');

  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [citiesRes, slotsRes] = await Promise.all([
      supabase.from('group_order_cities').select('*').order('position').order('name'),
      supabase.from('group_order_slots').select('*').order('delivery_date'),
    ]);
    if (citiesRes.error) toast.error('Erreur villes : ' + citiesRes.error.message);
    else setCities((citiesRes.data as City[]) ?? []);
    if (slotsRes.error) toast.error('Erreur créneaux : ' + slotsRes.error.message);
    else setSlots((slotsRes.data as Slot[]) ?? []);
    setLoading(false);
  };

  const addCity = async () => {
    const name = newCityName.trim();
    if (!name) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('group_order_cities')
      .insert({ name, position: cities.length + 1 })
      .select().single();
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCities((prev) => [...prev, data as City]);
      toast.success(`Ville « ${name} » ajoutée`);
    }
    setAddingCity(false);
    setNewCityName('');
    setSaving(false);
  };

  const toggleCity = async (city: City) => {
    setSaving(true);
    const { error } = await supabase
      .from('group_order_cities').update({ active: !city.active }).eq('id', city.id);
    if (error) toast.error('Erreur : ' + error.message);
    else setCities((prev) => prev.map((c) => c.id === city.id ? { ...c, active: !c.active } : c));
    setSaving(false);
  };

  const renameCity = async (city: City) => {
    const name = editingCityName.trim();
    if (!name) { toast.error('Le nom ne peut pas être vide.'); return; }
    if (name === city.name) { setEditingCityId(null); return; }
    setSaving(true);
    const { error } = await supabase.from('group_order_cities').update({ name }).eq('id', city.id);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCities((prev) => prev.map((c) => c.id === city.id ? { ...c, name } : c));
      toast.success('Ville renommée');
      setEditingCityId(null);
    }
    setSaving(false);
  };

  const deleteCity = async (city: City) => {
    const citySlots = slots.filter((s) => s.city_id === city.id);
    if (citySlots.length > 0) {
      toast.error('Supprimez d\'abord les créneaux de cette ville.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('group_order_cities').delete().eq('id', city.id);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCities((prev) => prev.filter((c) => c.id !== city.id));
      toast.success('Ville supprimée');
    }
    setSaving(false);
  };

  const addSlot = async (cityId: string) => {
    if (!newSlotDate) { toast.error('Choisissez une date.'); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from('group_order_slots')
      .insert({ city_id: cityId, delivery_date: newSlotDate })
      .select().single();
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setSlots((prev) => [...prev, data as Slot]);
      toast.success('Créneau ajouté');
    }
    setAddingSlotForCity(null);
    setNewSlotDate('');
    setSaving(false);
  };

  const toggleSlot = async (slot: Slot) => {
    setSaving(true);
    const { error } = await supabase
      .from('group_order_slots').update({ active: !slot.active }).eq('id', slot.id);
    if (error) toast.error('Erreur : ' + error.message);
    else setSlots((prev) => prev.map((s) => s.id === slot.id ? { ...s, active: !s.active } : s));
    setSaving(false);
  };

  const deleteSlot = async (slot: Slot) => {
    setSaving(true);
    const { error } = await supabase.from('group_order_slots').delete().eq('id', slot.id);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      toast.success('Créneau supprimé');
    }
    setSaving(false);
  };

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminLayout title="Config livraisons groupées" subtitle="Villes et créneaux disponibles">

      {loading && (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {cities.map((city) => {
            const citySlots = slots.filter((s) => s.city_id === city.id)
              .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date));

            return (
              <div
                key={city.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, hsl(60,3%,7%) 0%, hsl(0,3%,19%) 100%)' }}
              >
                {/* City header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  {editingCityId === city.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingCityName}
                        onChange={(e) => setEditingCityName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renameCity(city); if (e.key === 'Escape') setEditingCityId(null); }}
                        className="flex-1 text-sm font-semibold bg-white/10 border border-amber-400/40 rounded-lg px-2 py-0.5 text-white outline-none focus:border-amber-400"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => renameCity(city)}
                          disabled={saving}
                          className="w-7 h-7 rounded-lg bg-amber-400/20 hover:bg-amber-400/40 flex items-center justify-center transition"
                          title="Enregistrer"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          onClick={() => setEditingCityId(null)}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                          title="Annuler"
                        >
                          <X className="w-3.5 h-3.5 text-white/50" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={`text-sm font-semibold flex-1 ${city.active ? 'text-white' : 'text-white/40'}`}>
                        {city.name}
                        <span className="ml-2 text-[10px] font-normal text-white/30">
                          ({citySlots.length} créneau{citySlots.length !== 1 ? 'x' : ''})
                        </span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingCityId(city.id); setEditingCityName(city.name); }}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                          title="Renommer"
                        >
                          <Pencil className="w-3 h-3 text-white/50" />
                        </button>
                        <button
                          onClick={() => toggleCity(city)}
                          disabled={saving}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                          title={city.active ? 'Désactiver' : 'Activer'}
                        >
                          {city.active
                            ? <ToggleRight className="w-4 h-4 text-amber-400" />
                            : <ToggleLeft className="w-4 h-4 text-white/40" />}
                        </button>
                        <button
                          onClick={() => { setAddingSlotForCity(city.id); }}
                          className="w-7 h-7 rounded-lg bg-amber-400/20 hover:bg-amber-400/40 flex items-center justify-center transition"
                          title="Ajouter un créneau"
                        >
                          <Plus className="w-3 h-3 text-amber-400" />
                        </button>
                        <button
                          onClick={() => deleteCity(city)}
                          disabled={saving}
                          className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Slots */}
                {(citySlots.length > 0 || addingSlotForCity === city.id) && (
                  <div className="px-4 pb-3 border-t border-white/[0.07] pt-2 space-y-1.5">
                    {citySlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-2 pl-2">
                        <Calendar className="w-3 h-3 text-white/30 shrink-0" />
                        <span className={`text-sm flex-1 ${slot.active ? 'text-white/80' : 'text-white/30 line-through'}`}>
                          {formatDate(slot.delivery_date)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleSlot(slot)}
                            disabled={saving}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                            title={slot.active ? 'Fermer ce créneau' : 'Ouvrir ce créneau'}
                          >
                            {slot.active
                              ? <ToggleRight className="w-3.5 h-3.5 text-amber-400" />
                              : <ToggleLeft className="w-3.5 h-3.5 text-white/40" />}
                          </button>
                          <button
                            onClick={() => deleteSlot(slot)}
                            disabled={saving}
                            className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add slot inline */}
                    {addingSlotForCity === city.id && (
                      <div className="flex items-center gap-2 pl-2 mt-1">
                        <Calendar className="w-3 h-3 text-amber-400/60 shrink-0" />
                        <input
                          type="date"
                          autoFocus
                          min={today}
                          value={newSlotDate}
                          onChange={(e) => setNewSlotDate(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addSlot(city.id);
                            if (e.key === 'Escape') { setAddingSlotForCity(null); setNewSlotDate(''); }
                          }}
                          className="bg-white/10 border border-amber-400/40 text-white text-sm rounded-lg px-2 py-1 flex-1 focus:outline-none [color-scheme:dark]"
                        />
                        <button onClick={() => addSlot(city.id)} disabled={saving} className="w-6 h-6 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition">
                          <Check className="w-3 h-3 text-green-400" />
                        </button>
                        <button onClick={() => { setAddingSlotForCity(null); setNewSlotDate(''); }} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                          <X className="w-3 h-3 text-white/60" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add city */}
          {addingCity ? (
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(60,3%,7%) 0%, hsl(0,3%,19%) 100%)' }}
            >
              <MapPin className="w-4 h-4 text-amber-400/60 shrink-0" />
              <input
                autoFocus
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCity();
                  if (e.key === 'Escape') { setAddingCity(false); setNewCityName(''); }
                }}
                placeholder="Nom de la ville (ex: Garoua)…"
                className="bg-white/10 border border-amber-400/40 text-white text-sm rounded-lg px-3 py-1.5 flex-1 focus:outline-none placeholder:text-white/30"
              />
              <button onClick={addCity} disabled={saving} className="w-7 h-7 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition">
                <Check className="w-3.5 h-3.5 text-green-400" />
              </button>
              <button onClick={() => { setAddingCity(false); setNewCityName(''); }} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingCity(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ville
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminGroupOrdersConfig;
