export interface MenuItem {
  id: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  subcategory: string | null;
  image_url: string | null;
  emoji?: string;
  available: boolean | null;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
  emoji?: string | null;
  is_active: boolean;
  created_at?: string;
}
