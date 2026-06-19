import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore, Order } from '@/store/orderStore';

const OrderTrackingView = () => {
  const { orders, updateOrderStatus } = useOrderStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Simulate order progress
  useEffect(() => {
    const interval = setInterval(() => {
      orders.forEach(order => {
        if (order.status === 'delivered' || order.status === 'cancelled') return;
        const currentStep = order.tracking_steps.findIndex(s => !s.done);
        if (currentStep > 0 && currentStep < order.tracking_steps.length) {
          updateOrderStatus(order.id, order.tracking_steps[currentStep].step, currentStep);
        }
      });
    }, 10000); // advance every 10s for demo
    return () => clearInterval(interval);
  }, [orders, updateOrderStatus]);

  const currentOrder = selectedOrder
    ? orders.find(o => o.id === selectedOrder.id) || selectedOrder
    : null;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <p className="text-6xl mb-4">📦</p>
        <p className="text-lg font-medium">Aucune commande</p>
        <p className="text-sm">Vos commandes apparaîtront ici</p>
      </div>
    );
  }

  if (currentOrder) {
    const activeStepIndex = currentOrder.tracking_steps.findIndex(s => !s.done);
    const progress = activeStepIndex === -1 ? 100 : (activeStepIndex / (currentOrder.tracking_steps.length - 1)) * 100;

    return (
      <div className="p-4 space-y-6">
        <button onClick={() => setSelectedOrder(null)} className="text-primary font-medium text-sm">← Retour</button>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">Commande #{currentOrder.id}</h2>
          <p className="text-sm text-muted-foreground">
            Livraison estimée : {new Date(currentOrder.estimated_delivery).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-success rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {currentOrder.tracking_steps.map((step, i) => {
            const isActive = i === activeStepIndex;
            return (
              <div key={step.step} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-success' : isActive ? 'bg-primary animate-pulse-glow' : 'bg-muted'
                }`}>
                  <span className="text-sm">
                    {step.done ? '✅' : isActive ? '🔄' : i === 2 ? '🚗' : '📦'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.done || isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {step.time && <p className="text-xs text-muted-foreground">{step.time}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order items */}
        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Articles</h3>
          {currentOrder.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
              <span className="text-foreground">{(item.price * item.quantity).toFixed(2)} €</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{currentOrder.total.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-foreground">Mes Commandes</h2>
      <div className="space-y-3">
        {orders.map(order => {
          const isActive = order.status !== 'delivered' && order.status !== 'cancelled';
          return (
            <motion.button
              key={order.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOrder(order)}
              className="w-full glass-card p-4 text-left space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">#{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isActive ? 'bg-primary/20 text-primary' : 'bg-success/20 text-success'
                }`}>
                  {order.status_label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{order.items.length} article(s)</span>
                <span className="text-primary font-bold">{order.total.toFixed(2)} €</span>
              </div>
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow inline-block" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTrackingView;
