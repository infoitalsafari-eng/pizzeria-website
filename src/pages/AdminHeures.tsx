import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Heure {
  id: string;
  dayname: string;
  started: string;
  ending: string;
}

interface HeureRow extends Heure {
  closed: boolean;
  startedInput: string;
  endingInput: string;
  saving: boolean;
  dirty: boolean;
}

const toTimeInput = (s: string): string => {
  if (!s || s.toLowerCase() === 'fermé') return '';
  return s.replace('H', ':');
};

const fromTimeInput = (s: string): string => {
  if (!s) return 'Fermé';
  return s.replace(':', 'H');
};

const DAY_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const AdminHeures = () => {
  const [rows, setRows] = useState<HeureRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHeures(); }, []);

  const fetchHeures = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('heures_pizzeria').select('*');
    if (error) {
      toast.error('Erreur de chargement : ' + error.message);
      setLoading(false);
      return;
    }
    const sorted = (data as Heure[]).sort(
      (a, b) => DAY_ORDER.indexOf(a.dayname) - DAY_ORDER.indexOf(b.dayname),
    );
    setRows(sorted.map((h) => {
      const closed = !h.started || h.started.toLowerCase() === 'fermé';
      return {
        ...h,
        closed,
        startedInput: closed ? '' : toTimeInput(h.started),
        endingInput: closed ? '' : toTimeInput(h.ending),
        saving: false,
        dirty: false,
      };
    }));
    setLoading(false);
  };

  const updateRow = (id: string, patch: Partial<HeureRow>) => {
    setRows((prev) =>
      prev.map((r) => r.id === id ? { ...r, ...patch, dirty: true } : r),
    );
  };

  const saveRow = async (row: HeureRow) => {
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, saving: true } : r));
    const started = row.closed ? 'Fermé' : fromTimeInput(row.startedInput);
    const ending = row.closed ? 'Fermé' : fromTimeInput(row.endingInput);
    const { error } = await supabase
      .from('heures_pizzeria')
      .update({ started, ending })
      .eq('id', row.id);
    if (error) {
      toast.error(`Erreur pour ${row.dayname} : ` + error.message);
    } else {
      toast.success(`${row.dayname} enregistré.`);
      setRows((prev) =>
        prev.map((r) => r.id === row.id
          ? { ...r, started, ending, saving: false, dirty: false }
          : r,
        ),
      );
      return;
    }
    setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, saving: false } : r));
  };

  const dayInitial = (day: string) => day.slice(0, 2).toUpperCase();

  return (
    <AdminLayout
      title="Gestion des horaires"
      subtitle="Horaires d'ouverture par jour de la semaine"
    >
      {loading ? (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4"
              style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/30 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{dayInitial(row.dayname)}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">{row.dayname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-white/50 text-xs">Fermé</Label>
                  <Switch
                    checked={row.closed}
                    onCheckedChange={(v) =>
                      updateRow(row.id, {
                        closed: v,
                        startedInput: v ? '' : row.startedInput || '08:00',
                        endingInput: v ? '' : row.endingInput || '23:00',
                      })
                    }
                  />
                </div>
              </div>

              {!row.closed && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <Label className="text-white/50 text-xs mb-1 block">Ouverture</Label>
                    <input
                      type="time"
                      value={row.startedInput}
                      onChange={(e) => updateRow(row.id, { startedInput: e.target.value })}
                      className="w-full bg-white/10 border border-white/15 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-white/50 text-xs mb-1 block">Fermeture</Label>
                    <input
                      type="time"
                      value={row.endingInput}
                      onChange={(e) => updateRow(row.id, { endingInput: e.target.value })}
                      className="w-full bg-white/10 border border-white/15 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>
              )}

              {row.closed && (
                <p className="text-white/40 text-xs mb-3 italic">Ce jour est marqué comme fermé.</p>
              )}

              <button
                onClick={() => saveRow(row)}
                disabled={row.saving || !row.dirty}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition
                  disabled:opacity-40 disabled:cursor-not-allowed
                  bg-primary/80 hover:bg-primary text-white"
              >
                {row.saving
                  ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                {row.saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminHeures;
