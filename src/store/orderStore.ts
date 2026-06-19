import { create } from 'zustand';

export interface TrackingStep {
  step: string;
  label: string;
  done: boolean;
  time: string | null;
}

export interface Order {
  id: number;
  status: string;
  status_label: string;
  created_at: string;
  estimated_delivery: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  tracking_steps: TrackingStep[];
}

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: number, status: string, stepIndex: number) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (id, status, stepIndex) => set((state) => ({
    orders: state.orders.map(o => {
      if (o.id !== id) return o;
      return {
        ...o,
        status,
        status_label: o.tracking_steps[stepIndex]?.label || status,
        tracking_steps: o.tracking_steps.map((s, i) => ({
          ...s,
          done: i <= stepIndex,
          time: i <= stepIndex && !s.time ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : s.time,
        })),
      };
    }),
  })),
}));
