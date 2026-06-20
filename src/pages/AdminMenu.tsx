import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  emoji: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

interface FormState {
  name: string;
  category: string;
  price: string;
  description: string;
  emoji: string;
  available: boolean;
  newCategory: string;
  useNewCategory: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  price: '',
  description: '',
  emoji: '',
  available: true,
  newCategory: '',
  useNewCategory: false,
};

const AdminMenu = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name');
    if (error) toast.error('Erreur de chargement : ' + error.message);
    else setItems((data ?? []) as MenuItem[]);
    setLoading(false);
  };

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items],
  );

  const filtered = useMemo(() => {
    let list = items;
    if (filterCat !== 'all') list = list.filter((i) => i.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name?.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, filterCat]);

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditId(item.id);
    setForm({
      name: item.name ?? '',
      category: item.category ?? '',
      price: String(item.price ?? ''),
      description: item.description ?? '',
      emoji: item.emoji ?? '',
      available: item.available,
      newCategory: '',
      useNewCategory: false,
    });
    resetImageState();
    setImageUrl(item.image_url ?? '');
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo dépasse 5 Mo.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    const category = form.useNewCategory ? form.newCategory.trim() : form.category;
    if (!form.name.trim() || !category || !form.price) {
      toast.error('Nom, catégorie et prix sont requis.');
      return;
    }
    setSaving(true);

    let finalImageUrl: string | null = imageUrl || null;

    if (imageFile) {
      const ext = imageFile.name.split('.').pop() ?? 'jpg';
      const path = `${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(path, imageFile, { upsert: true, contentType: imageFile.type });
      if (uploadError) {
        toast.error("Erreur d'upload : " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(uploadData.path);
      finalImageUrl = urlData.publicUrl;
    }

    const payload = {
      name: form.name.trim(),
      category,
      price: parseFloat(form.price),
      description: form.description.trim() || null,
      emoji: form.emoji.trim() || null,
      image_url: finalImageUrl,
      available: form.available,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editId);
      if (error) {
        toast.error('Erreur : ' + error.message);
      } else {
        toast.success('Produit mis à jour.');
        fetchItems();
        setDialogOpen(false);
      }
    } else {
      const { error } = await supabase.from('menu_items').insert({
        id: crypto.randomUUID(),
        ...payload,
      });
      if (error) {
        toast.error('Erreur : ' + error.message);
      } else {
        toast.success('Produit ajouté.');
        fetchItems();
        setDialogOpen(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase.from('menu_items').delete().eq('id', deleteId);
    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      toast.success('Produit supprimé.');
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const toggleAvailable = async (item: MenuItem) => {
    const next = !item.available;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: next } : i));
    const { error } = await supabase
      .from('menu_items')
      .update({ available: next, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (error) {
      toast.error('Erreur : ' + error.message);
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !next } : i));
    }
  };

  const deleteName = deleteId ? items.find((i) => i.id === deleteId)?.name : '';
  const previewSrc = imagePreview || imageUrl || null;

  return (
    <AdminLayout
      title="Gestion du menu"
      subtitle={`${items.length} produit${items.length !== 1 ? 's' : ''} au total`}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-primary transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
            </button>
          )}
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-white/10 border border-white/15 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition"
        >
          <option value="all" className="bg-neutral-900">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c} className="bg-neutral-900">{c}</option>
          ))}
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nouveau produit
        </button>
      </div>

      <p className="text-white/50 text-xs mb-3">
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        {(filterCat !== 'all' || search.trim()) && ` (sur ${items.length})`}
      </p>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.008, 0.25) }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-9 h-9 rounded-lg object-cover shrink-0 bg-white/10"
                />
              ) : (
                <span className="text-xl w-9 text-center shrink-0 leading-none">
                  {item.emoji || '🍽️'}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-white/50 text-xs truncate">
                  {item.category} · {item.price?.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <Switch
                checked={item.available}
                onCheckedChange={() => toggleAvailable(item)}
                className="shrink-0"
              />
              <button
                onClick={() => openEdit(item)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition shrink-0"
                aria-label="Modifier"
              >
                <Edit2 className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => setDeleteId(item.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/20 hover:bg-red-500/40 transition shrink-0"
                aria-label="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </motion.div>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-white/40 py-12 text-sm">Aucun produit trouvé.</p>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-neutral-900 border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? 'Modifier le produit' : 'Nouveau produit'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Photo / Emoji */}
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Photo</Label>
              {previewSrc ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={previewSrc}
                    alt="Aperçu"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition"
                    aria-label="Supprimer la photo"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 text-[10px] font-medium bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-lg transition"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-white/15 hover:border-primary/50 hover:bg-white/5 rounded-xl flex flex-col items-center justify-center gap-2 transition"
                >
                  <ImagePlus className="w-6 h-6 text-white/30" />
                  <span className="text-white/40 text-xs">Cliquer pour ajouter une photo</span>
                  <span className="text-white/25 text-[10px]">JPG, PNG, WebP · max 5 Mo</span>
                </button>
              )}
            </div>

            {/* Nom */}
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du produit"
                className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-primary"
              />
            </div>

            {/* Catégorie */}
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Catégorie *</Label>
              {!form.useNewCategory ? (
                <div className="flex gap-2">
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger className="bg-white/10 border-white/15 text-white flex-1 focus:border-primary">
                      <SelectValue placeholder="Choisir une catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 max-h-48">
                      {categories.map((c) => (
                        <SelectItem key={c} value={c} className="text-white focus:bg-white/10">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, useNewCategory: true, category: '' }))}
                    className="text-xs text-primary hover:text-primary/80 whitespace-nowrap px-2 shrink-0"
                  >
                    + Nouvelle
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={form.newCategory}
                    onChange={(e) => setForm((f) => ({ ...f, newCategory: e.target.value }))}
                    placeholder="Nouvelle catégorie"
                    className="bg-white/10 border-white/15 text-white placeholder-white/30 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, useNewCategory: false, newCategory: '' }))}
                    className="text-xs text-white/50 hover:text-white px-2 shrink-0"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {/* Prix */}
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Prix (FCFA) *</Label>
              <Input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Ex : 6500"
                className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-primary"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-white/70 text-xs mb-1.5 block">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description courte (optionnel)"
                className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-primary"
              />
            </div>

            {/* Emoji + Disponible */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-white/70 text-xs mb-1.5 block">
                  Emoji{previewSrc ? ' (ignoré si photo)' : ''}
                </Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="🍕"
                  className="bg-white/10 border-white/15 text-white placeholder-white/30 focus:border-primary"
                  maxLength={4}
                />
              </div>
              <div className="flex flex-col justify-end pb-1 gap-1.5">
                <Label className="text-white/70 text-xs">Disponible</Label>
                <div className="flex items-center gap-2 h-9">
                  <Switch
                    checked={form.available}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, available: v }))}
                  />
                  <span className="text-white/60 text-xs">{form.available ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/80 text-white"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {imageFile ? 'Upload…' : 'Enregistrement…'}
                </span>
              ) : (
                editId ? 'Enregistrer' : 'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent className="bg-neutral-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Êtes-vous sûr de vouloir supprimer{' '}
              <strong className="text-white">« {deleteName} »</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/10 hover:bg-white/20">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminMenu;
