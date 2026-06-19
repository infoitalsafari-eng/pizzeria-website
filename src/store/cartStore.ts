import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  deliveryType: 'delivery' | 'pickup';
  address: string;
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  setDeliveryType: (type: 'delivery' | 'pickup') => void;
  setAddress: (address: string) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  deliveryType: 'delivery',
  address: '',
  addItem: (product) => set((state) => {
    const existing = state.items.find(i => i.id === product.id);
    if (existing) {
      return { items: state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
  updateQuantity: (id, quantity) => set((state) => ({
    items: quantity <= 0
      ? state.items.filter(i => i.id !== id)
      : state.items.map(i => i.id === id ? { ...i, quantity } : i),
  })),
  setDeliveryType: (type) => set({ deliveryType: type }),
  setAddress: (address) => set({ address }),
  clearCart: () => set({ items: [], address: '' }),
  total: () => {
    const { items, deliveryType } = get();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return subtotal + (deliveryType === 'delivery' ? 2.99 : 0);
  },
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
