import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, LogIn, ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } else {
      navigate('/admin');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setForgotLoading(false);

    if (error) {
      setForgotError("Impossible d'envoyer l'email. Vérifiez l'adresse saisie.");
    } else {
      setForgotSent(true);
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
          <button
            onClick={() => navigate('/')}
            className="mb-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden p-1 mb-4">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-white">Administration</h1>
            <p className="text-xs text-white/60 mt-1">Pizzeria Chez Moi · Garoua</p>
          </div>

          <AnimatePresence mode="wait">
            {!showForgot ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); setForgotError(''); }}
                    className="text-xs text-white/50 hover:text-white/80 transition underline underline-offset-2"
                  >
                    Mot de passe oublié ?
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
                    <LogIn className="w-4 h-4" />
                  )}
                  Se connecter
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <p className="text-white font-semibold text-sm">Réinitialiser le mot de passe</p>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  Entrez votre adresse email. Vous recevrez un lien pour créer un nouveau mot de passe.
                </p>

                <AnimatePresence mode="wait">
                  {!forgotSent ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleForgotPassword}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          placeholder="Adresse email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="w-full bg-white/10 border border-white/15 text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                      </div>

                      {forgotError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-xs text-center"
                        >
                          {forgotError}
                        </motion.p>
                      )}

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-primary hover:bg-primary/80 disabled:opacity-60 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition"
                      >
                        {forgotLoading ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        Envoyer le lien
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="w-full text-xs text-white/40 hover:text-white/70 transition text-center"
                      >
                        ← Retour à la connexion
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-3 py-4"
                    >
                      <CheckCircle className="w-10 h-10 text-green-400" />
                      <p className="text-white font-semibold text-sm text-center">Email envoyé !</p>
                      <p className="text-white/50 text-xs text-center leading-relaxed">
                        Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="mt-2 text-xs text-white/40 hover:text-white/70 transition underline underline-offset-2"
                      >
                        ← Retour à la connexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
