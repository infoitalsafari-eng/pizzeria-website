import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Check, X, ChevronDown, ChevronRight, Lock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Category } from '@/data/types';

const FIXED_MAINS = ['Pizza', 'Restaurant', 'Bar', 'Boutique'] as const;

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editEmoji, setEditEmoji] = useState('');

  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const [addingMain, setAddingMain] = useState(false);
  const [newMainName, setNewMainName] = useState('');
  const [newMainEmoji, setNewMainEmoji] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories_pizzeria')
      .select('*')
      .order('position')
      .order('name');
    if (error) toast.error('Erreur : ' + error.message);
    else setCategories((data as Category[]) ?? []);
    setLoading(false);
  };

  const mainCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditValue(cat.name);
    setEditEmoji(cat.emoji ?? '');
  };

  const cancelEdit = () => { setEditingId(null); setEditValue(''); setEditEmoji(''); };

  const saveEdit = async (id: string, isMain = false) => {
    const name = editValue.trim();
    if (!name) return;
    setSaving(true);
    const updates: Record<string, unknown> = { name };
    if (isMain) updates.emoji = editEmoji.trim() || null;
    const { error } = await supabase
      .from('categories_pizzeria')
      .update(updates)
      .eq('id', id);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCategories((prev) => prev.map((c) =>
        c.id === id ? { ...c, name, ...(isMain ? { emoji: (editEmoji.trim() || null) } : {}) } : c
      ));
      toast.success('Modifié');
    }
    setEditingId(null);
    setEditValue('');
    setEditEmoji('');
    setSaving(false);
  };

  const deleteCategory = async (cat: Category) => {
    const subs = getSubcategories(cat.id);
    if (subs.length > 0) {
      toast.error('Supprimez d\'abord les sous-catégories.');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('categories_pizzeria')
      .delete()
      .eq('id', cat.id);
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      toast.success('Supprimé');
    }
    setSaving(false);
  };

  const addMainCategory = async () => {
    const name = newMainName.trim();
    if (!name) return;
    setSaving(true);
    const emoji = newMainEmoji.trim() || null;
    const { data, error } = await supabase
      .from('categories_pizzeria')
      .insert({ name, emoji, parent_id: null, position: mainCategories.length + 1 })
      .select()
      .single();
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCategories((prev) => [...prev, data as Category]);
      toast.success(`Catégorie « ${name} » ajoutée — elle apparaîtra comme onglet dans le menu public.`);
    }
    setAddingMain(false);
    setNewMainName('');
    setNewMainEmoji('');
    setSaving(false);
  };

  const addSubcategory = async (parentId: string) => {
    const name = newSubName.trim();
    if (!name) return;
    setSaving(true);
    const parent = categories.find((c) => c.id === parentId);
    const siblings = getSubcategories(parentId);
    const { data, error } = await supabase
      .from('categories_pizzeria')
      .insert({ name, parent_id: parentId, position: siblings.length + 1 })
      .select()
      .single();
    if (error) toast.error('Erreur : ' + error.message);
    else {
      setCategories((prev) => [...prev, data as Category]);
      setExpanded((prev) => ({ ...prev, [parentId]: true }));
      toast.success(`Sous-catégorie ajoutée sous « ${parent?.name} »`);
    }
    setAddingSubFor(null);
    setNewSubName('');
    setSaving(false);
  };

  return (
    <AdminLayout
      title="Catégories"
      subtitle="Onglets du menu public et leurs sous-catégories"
    >
      {/* Info banner */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2 bg-white/5 border border-white/10">
        <Info className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
        <p className="text-white/50 text-xs leading-relaxed">
          Chaque catégorie principale correspond à un onglet dans le menu public. Les 4 de base (Pizza, Restaurant, Bar, Boutique) sont protégées. Vous pouvez en ajouter de nouvelles et gérer les sous-catégories librement.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-14">
          <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {mainCategories.map((main) => {
            const subs = getSubcategories(main.id);
            const isOpen = expanded[main.id];
            const isFixed = (FIXED_MAINS as readonly string[]).includes(main.name);

            return (
              <div
                key={main.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, hsl(60,3%,7%) 0%, hsl(0,3%,19%) 100%)' }}
              >
                {/* Main category row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(main.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {isOpen
                      ? <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-white/50 shrink-0" />
                    }
                    <span className="text-white font-semibold text-sm">
                      {main.name}
                      {isFixed && (
                        <span className="ml-2 text-[10px] text-white/30 font-normal bg-white/5 px-1.5 py-0.5 rounded">
                          fixe
                        </span>
                      )}
                      <span className="ml-2 text-white/40 text-xs font-normal">
                        ({subs.length} sous-catégorie{subs.length !== 1 ? 's' : ''})
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {isFixed ? (
                      /* Fixed main: only allow adding subcategories */
                      <button
                        onClick={() => { setAddingSubFor(main.id); setExpanded(p => ({...p, [main.id]: true})); }}
                        className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary/40 flex items-center justify-center transition"
                        title="Ajouter une sous-catégorie"
                      >
                        <Plus className="w-3 h-3 text-primary" />
                      </button>
                    ) : (
                      /* Non-fixed main: full edit/delete/add sub */
                      editingId === main.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(main.id, true)}
                            disabled={saving}
                            className="w-7 h-7 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition"
                          >
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                          >
                            <X className="w-3.5 h-3.5 text-white/60" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(main)}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                            title="Renommer"
                          >
                            <Edit2 className="w-3 h-3 text-white" />
                          </button>
                          <button
                            onClick={() => deleteCategory(main)}
                            disabled={saving}
                            className="w-7 h-7 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                          <button
                            onClick={() => { setAddingSubFor(main.id); setExpanded(p => ({...p, [main.id]: true})); }}
                            className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary/40 flex items-center justify-center transition"
                            title="Ajouter une sous-catégorie"
                          >
                            <Plus className="w-3 h-3 text-primary" />
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Inline edit row for non-fixed mains (shown in the header area) */}
                {editingId === main.id && !isFixed && (
                  <div className="px-4 pb-3 -mt-1 flex gap-2">
                    <input
                      value={editEmoji}
                      onChange={(e) => setEditEmoji(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(main.id, true);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      placeholder="🍴"
                      className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 w-16 text-center focus:outline-none"
                      maxLength={4}
                    />
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(main.id, true);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 flex-1 focus:outline-none"
                    />
                  </div>
                )}

                {/* Subcategories */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 border-t border-white/[0.07] pt-2 space-y-1">
                        {subs.length === 0 && addingSubFor !== main.id && (
                          <p className="text-white/30 text-xs py-1">Aucune sous-catégorie</p>
                        )}

                        {subs.map((sub) => {
                          const isEditingSub = editingId === sub.id;
                          return (
                            <div key={sub.id} className="flex items-center gap-2 pl-4">
                              <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                              {isEditingSub ? (
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(sub.id);
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-2 py-1 flex-1 focus:outline-none"
                                />
                              ) : (
                                <span className="text-white/80 text-sm flex-1">{sub.name}</span>
                              )}
                              <div className="flex items-center gap-1 shrink-0">
                                {isEditingSub ? (
                                  <>
                                    <button onClick={() => saveEdit(sub.id)} disabled={saving} className="w-6 h-6 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition">
                                      <Check className="w-3 h-3 text-green-400" />
                                    </button>
                                    <button onClick={cancelEdit} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                                      <X className="w-3 h-3 text-white/60" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(sub)} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                                      <Edit2 className="w-3 h-3 text-white/70" />
                                    </button>
                                    <button onClick={() => deleteCategory(sub)} disabled={saving} className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition">
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add subcategory inline form */}
                        {addingSubFor === main.id && (
                          <div className="flex items-center gap-2 pl-4 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                            <input
                              autoFocus
                              value={newSubName}
                              onChange={(e) => setNewSubName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addSubcategory(main.id);
                                if (e.key === 'Escape') { setAddingSubFor(null); setNewSubName(''); }
                              }}
                              placeholder="Nom de la sous-catégorie…"
                              className="bg-white/10 border border-primary/40 text-white text-sm rounded-lg px-2 py-1 flex-1 focus:outline-none placeholder:text-white/30"
                            />
                            <button onClick={() => addSubcategory(main.id)} disabled={saving} className="w-6 h-6 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition">
                              <Check className="w-3 h-3 text-green-400" />
                            </button>
                            <button onClick={() => { setAddingSubFor(null); setNewSubName(''); }} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                              <X className="w-3 h-3 text-white/60" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Add main category */}
          {addingMain ? (
            <div
              className="rounded-2xl px-4 py-3 space-y-2"
              style={{ background: 'linear-gradient(135deg, hsl(60,3%,7%) 0%, hsl(0,3%,19%) 100%)' }}
            >
              <div className="flex items-center gap-2">
                <input
                  value={newMainEmoji}
                  onChange={(e) => setNewMainEmoji(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addMainCategory();
                    if (e.key === 'Escape') { setAddingMain(false); setNewMainName(''); setNewMainEmoji(''); }
                  }}
                  placeholder="🍴"
                  className="bg-white/10 border border-primary/40 text-white text-sm rounded-lg px-3 py-1.5 w-16 text-center focus:outline-none placeholder:text-white/30"
                  maxLength={4}
                />
                <input
                  autoFocus
                  value={newMainName}
                  onChange={(e) => setNewMainName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addMainCategory();
                    if (e.key === 'Escape') { setAddingMain(false); setNewMainName(''); setNewMainEmoji(''); }
                  }}
                  placeholder="Nom de la catégorie (ex: Desserts)…"
                  className="bg-white/10 border border-primary/40 text-white text-sm rounded-lg px-3 py-1.5 flex-1 focus:outline-none placeholder:text-white/30"
                />
                <button onClick={addMainCategory} disabled={saving} className="w-7 h-7 rounded-lg bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </button>
                <button onClick={() => { setAddingMain(false); setNewMainName(''); setNewMainEmoji(''); }} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <X className="w-3.5 h-3.5 text-white/60" />
                </button>
              </div>
              <p className="text-white/30 text-[11px] pl-1">Saisissez un emoji pour l'onglet (ex : 🍰, 🥗, ☕). Laissez vide pour utiliser l'icône par défaut.</p>
            </div>
          ) : (
            <button
              onClick={() => setAddingMain(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              Ajouter une catégorie
            </button>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategories;
