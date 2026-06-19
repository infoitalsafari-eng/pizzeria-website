export interface MenuItem {
  id: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  image_url: string | null;
  emoji?: string;
  available: boolean | null;
}