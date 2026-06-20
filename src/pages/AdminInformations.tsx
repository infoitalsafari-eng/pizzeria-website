import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Instagram, Facebook, Phone, MapPin, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface InfoRow {
  id: string;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  service: string | null;
  maps: string | null;
}

interface FormState {
  instagram: string;
  facebook: string;
  whatsapp: string;
  service: string;
  maps: string;
}

const EMPTY: FormState = {
  instagram: '',
  facebook: '',
  whatsapp: '',
  service: '',
  maps: '',
};

const FIELDS: {
  key: keyof FormState;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'pizzeria.chezmoi',
    icon: <Instagram className="w-4 h-4 text-white/40" />,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'PizzeriaChezMoi237',
    icon: <Facebook className="w-4 h-4 text-white/40" />,
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    placeholder: '+237600000000',
    icon: <MessageCircle className="w-4 h-4 text-white/40" />,
  },
  {
    key: 'service',
    label: 'Téléphone service',
    placeholder: '+237 600 000 000',
    icon: <Phone className="w-4 h-4 text-white/40" />,
  },
  {
    key: 'maps',
    label: 'Lien Google Maps',
    placeholder: 'https://maps.google.com/?q=...',
    icon: <MapPin className="w-4 h-4 text-white/40" />,
    type: 'url',
  },
];

const AdminInformations = () => {
  const [rowId, setRowId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchInfo(); }, []);

  const fetchInfo = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('informations_pizzeria')
      .select('*')
      .limit(1)
      .single();
    if (error) {
      toast.error('Erreur de chargement : ' + error.message);
    } else {
      const row = data as InfoRow;
      setRowId(row.id);
      setForm({
        instagram: row.instagram ?? '',
        facebook: row.facebook ?? '',
        whatsapp: row.whatsapp ?? '',
        service: row.service ?? '',
        maps: row.maps ?? '',
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!rowId) return;
    setSaving(true);
    const { error } = await supabase
      .from('informations_pizzeria')
      .update({
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        service: form.service.trim() || null,
        maps: form.maps.trim() || null,
      })
      .eq('id', rowId);
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      toast.success('Informations enregistrées.');
    }
    setSaving(false);
  };

  return (
    <AdminLayout
      title="Informations restaurant"
      subtitle="Coordonnées et liens publics affichés sur le site"
    >
      {loading ? (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
        >
          {FIELDS.map(({ key, label, placeholder, icon, type }) => (
            <div key={key}>
              <Label className="text-white/70 text-xs mb-1.5 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {icon}
                </span>
                <Input
                  type={type ?? 'text'}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="bg-white/10 border-white/15 text-white placeholder-white/30 pl-10 focus:border-primary"
                />
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-3"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Enregistrement…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </span>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminInformations;
