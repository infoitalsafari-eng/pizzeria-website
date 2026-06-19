import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface SplashScreenProps {
  onDone: () => void;
}

const SplashScreen = ({ onDone }: SplashScreenProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setShow(false); onDone(); }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6"
    >
      <motion.img
        src={logo}
        alt="PizzaChezMoi"
        className="w-24 h-24"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <h1 className="text-2xl font-bold text-foreground">Pizza<span className="text-primary">ChezMoi</span></h1>
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </motion.div>
  );
};

export default SplashScreen;
