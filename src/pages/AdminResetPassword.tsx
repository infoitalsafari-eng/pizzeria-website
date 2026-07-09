import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const AdminResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré.");
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 3000);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)',
      }}
    >
      <div className="w-full max-w-sm px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-8 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)' }}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden p-1 mb-4">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white">Nouveau mot de passe</h1>
            <p className="text-xs text-white/60 mt-1">Pizzeria Chez Moi · Garoua</p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <CheckCircle className="w-12 h-12 text-green-400" />
              <p className="text-white font-semibold text-sm text-center">Mot de passe mis à jour !</p>
              <p className="text-white/50 text-xs text-center">Redirection vers la connexion…</p>
            </motion.div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="w-10 h-10 text-yellow-400" />
              <p className="text-white/70 text-sm text-center leading-relaxed">
                Lien invalide ou expiré.<br />
                Veuillez recommencer depuis la page de connexion.
              </p>
              <button
                onClick={() => navigate('/admin/login')}
                className="mt-2 text-xs text-primary hover:text-primary/80 transition underline underline-offset-2"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Enregistrer le mot de passe
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
