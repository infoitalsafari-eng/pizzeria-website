import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

interface InstallPopupProps {
  open: boolean;
  onClose: () => void;
}

const InstallPopup = ({ open, onClose }: InstallPopupProps) => {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) { setProgress(0); setDone(false); return; }
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); setDone(true); return 100; }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [open]);

  const handleOpenApp = () => {
    window.open(window.location.origin, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="glass-card p-6 w-full max-w-sm space-y-5"
          >
            <div className="flex items-center gap-4">
              <img src={logo} alt="PizzaChezMoi" className="w-16 h-16 rounded-2xl" />
              <div>
                <h3 className="text-lg font-bold text-foreground">PizzaChezMoi</h3>
                <p className="text-sm text-muted-foreground">Commandez vos pizzas</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Installation...</span>
                <span className="text-primary font-medium">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={!done}
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium disabled:opacity-40 transition-opacity"
              >
                OK
              </button>
              <button
                disabled={!done}
                onClick={handleOpenApp}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40 transition-opacity"
              >
                Ouvrir
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPopup;
