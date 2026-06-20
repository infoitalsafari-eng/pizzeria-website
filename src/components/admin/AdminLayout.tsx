import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)' }}
    >
      <div className="mx-auto max-w-2xl px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
            <div className="w-10 h-7 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center p-0.5">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>

        <h1 className="text-white text-xl font-bold mb-1">{title}</h1>
        {subtitle && <p className="text-white/70 text-xs mb-5">{subtitle}</p>}

        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
