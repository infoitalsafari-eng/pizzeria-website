import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Smartphone,
  UtensilsCrossed,
  Clock,
  MessageCircle,
  Share2,
  Lock,
} from 'lucide-react';
import { isMobileDevice } from '@/lib/device';
import InstallPopup from '@/components/InstallPopup';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';

interface LinkCardProps {
  href?: string;
  onClick?: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  delay?: number;
  internal?: boolean;
}

interface Infos {
  id: string | null;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  service: string | null;
  maps: string | null;
}

const LinkCard = ({ href, onClick, icon, title, subtitle, delay = 0, internal = false }: LinkCardProps) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full bg-white rounded-2xl shadow-lg flex items-center gap-4 px-4 py-3 cursor-pointer hover:shadow-xl transition-shadow"
      style={{
        background:
          'linear-gradient(135deg, hsl(60, 3%, 7%) 0%, hsl(0, 3%, 19%) 100%)',
      }}
    >
      <div className="w-14 h-14 rounded-xl bg-primary/40 flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-center pr-14">
        <p className="font-bold leading-tight text-white">{title}</p>
        {subtitle && <p className="text-xs text-neutral-300 mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }
  if (internal && href) {
    return (
      <Link to={href} className="block w-full">
        {content}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
      {content}
    </a>
  );
};

const LandingPage = () => {
  const [installOpen, setInstallOpen] = useState(false);
  const isMobile = false;
  const navigate = useNavigate();

  const [info, setInfo] = useState<Infos | null>(null);

  useEffect(() => {
    supabase
      .from('informations_pizzeria')
      .select('id, instagram, facebook, whatsapp, service, maps')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setInfo(data as Infos);
      });
  }, []);

  const infos = {
    instagram: info?.instagram ? `https://instagram.com/${info.instagram}` : '#',
    facebook: info?.facebook ? `https://facebook.com/${info.facebook}` : '#',
    whatsapp: info?.whatsapp ? `https://wa.me/${info.whatsapp}` : '#',
    service: info?.service ? `tel:${info.service}` : '#',
    maps: info?.maps ?? '#',
  };

  const shareUrl = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Pizzeria Chez Moi',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          'linear-gradient(135deg, hsl(56, 28%, 68%) 0%, hsl(0, 90%, 47%) 100%)',
      }}
    >
      <div className="mx-auto max-w-md px-5 py-6 flex flex-col items-center text-white">
        {/* Top bar */}
        <div className="w-full flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/admin/login')}
            title="Administration"
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={shareUrl}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-48 h-28 rounded-full bg-white shadow-2xl flex items-center justify-center overflow-hidden p-2"
        >
          <img src={logo} alt="Pizzeria Chez Moi" className="w-48 h-28 object-contain" />
        </motion.div>

        {/* Handle */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-xl font-bold tracking-tight"
        >
          @{info?.instagram ?? 'pizzeria.chezmoi'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-white/95 text-center"
        >
          Authentique pizza italienne · Garoua
        </motion.p>

        {/* Links */}
        <div className="w-full mt-8 space-y-3">
          {isMobile && (
            <LinkCard
              onClick={() => setInstallOpen(true)}
              icon={<Smartphone className="w-6 h-6" />}
              title="INSTALLER L'APPLICATION"
              subtitle="Commander en un clic"
              delay={0.35}
            />
          )}
          <LinkCard
            href="/menu"
            internal
            icon={<UtensilsCrossed className="w-6 h-6" />}
            title="MENU – PIZZERIA"
            subtitle="Découvrir notre carte"
            delay={0.4}
          />
          <LinkCard
            href="/heurs"
            internal
            icon={<Clock className="w-6 h-6" />}
            title="NOS HEURES"
            subtitle="Découvrir nos heures"
            delay={0.4}
          />
          <LinkCard
            href={infos.facebook}
            icon={<Facebook className="w-6 h-6" />}
            title="FACEBOOK"
            subtitle="Rejoinez sur sur facebook"
            delay={0.4}
          />
          <LinkCard
            href={infos.whatsapp}
            icon={<MessageCircle className="w-6 h-6" />}
            title="COMMANDER VIA WHATSAPP"
            subtitle="Réponse rapide"
            delay={0.5}
          />
          <LinkCard
            href={infos.service}
            icon={<Phone className="w-6 h-6" />}
            title="NOUS APPELER"
            subtitle={info?.service ?? ''}
            delay={0.55}
          />
          <LinkCard
            href={infos.maps}
            icon={<MapPin className="w-6 h-6" />}
            title="NOUS TROUVER"
            subtitle="Centre-ville, Garoua"
            delay={0.6}
          />
          <LinkCard
            href={infos.instagram}
            icon={<Instagram className="w-6 h-6" />}
            title="INSTAGRAM"
            subtitle={`@${info?.instagram ?? ''}`}
            delay={0.65}
          />
        </div>

        {/* Social row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 flex items-center gap-5"
        >
          <a href={infos.instagram} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition">
            <Instagram className="w-7 h-7" />
          </a>
          <a href={infos.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition">
            <MessageCircle className="w-7 h-7" />
          </a>
        </motion.div>

        <p className="mt-8 text-[11px] text-white/70">© 2026 Pizzeria Chez Moi · Since 2019</p>

        {/* Admin link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mb-4 mt-2"
        >
          <button
            onClick={() => navigate('/admin/login')}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-[11px] transition"
          >
            <Lock className="w-3 h-3" />
            Se connecter
          </button>
        </motion.div>
      </div>

      <InstallPopup open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
};

export default LandingPage;
