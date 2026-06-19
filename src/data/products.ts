export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  available: boolean;
}

export const categories = ['Toutes', 'Classiques', 'Végétariennes', 'Spéciales', 'Boissons'];

export const products: Product[] = [
  { id: 1, name: 'Margherita', category: 'Classiques', price: 10.50, description: 'Tomate, mozzarella, basilic frais', image_url: '', available: true },
  { id: 2, name: 'Pepperoni', category: 'Classiques', price: 13.00, description: 'Pepperoni, mozzarella, sauce tomate', image_url: '', available: true },
  { id: 3, name: 'Regina', category: 'Classiques', price: 12.50, description: 'Jambon, champignons, mozzarella', image_url: '', available: true },
  { id: 4, name: '4 Fromages', category: 'Spéciales', price: 14.50, description: 'Mozzarella, gorgonzola, parmesan, chèvre', image_url: '', available: true },
  { id: 5, name: 'Végétarienne', category: 'Végétariennes', price: 12.00, description: 'Poivrons, oignons, champignons, olives', image_url: '', available: true },
  { id: 6, name: 'Calzone', category: 'Spéciales', price: 15.00, description: 'Chausson farci jambon, fromage, champignons', image_url: '', available: true },
  { id: 7, name: 'Hawaienne', category: 'Classiques', price: 13.50, description: 'Jambon, ananas, mozzarella', image_url: '', available: true },
  { id: 8, name: 'Caprese', category: 'Végétariennes', price: 11.50, description: 'Tomates cerises, mozzarella di bufala, basilic', image_url: '', available: true },
  { id: 9, name: 'Coca-Cola', category: 'Boissons', price: 2.50, description: '33cl', image_url: '', available: true },
  { id: 10, name: 'Eau minérale', category: 'Boissons', price: 1.50, description: '50cl', image_url: '', available: true },
  { id: 11, name: 'Tiramisu', category: 'Spéciales', price: 6.00, description: 'Dessert italien classique', image_url: '', available: true },
  { id: 12, name: 'Diavola', category: 'Spéciales', price: 14.00, description: 'Salami piquant, piments, mozzarella', image_url: '', available: true },
];
