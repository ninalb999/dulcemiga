export type PortionPrice = {
  label: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  portions: string;
  portion_options: PortionPrice[];
  image_url: string;
  filling_ids: string[];
  is_featured: boolean;
};

export type Filling = {
  id: string;
  name: string;
  description: string;
  extra_price: number;
  color: string;
};

export type Dough = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export type CarouselSlide = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  target_type: 'Producto' | 'Catalogo' | 'WhatsApp' | 'Personalizado';
  target_value: string;
  is_active: boolean;
};

export type FooterConfig = {
  brand_text: string;
  address: string;
  phone: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  copyright: string;
  schedule?: string;
};

export type OrderPayload = {
  full_name: string;
  phone: string;
  product: string;
  filling?: string;
  fillings: string[];
  dough: string;
  doughs: string[];
  portions: string;
  selected_price: number | null;
  delivery_mode: string;
  delivery_date: string;
  message: string;
};

export type ContactPayload = {
  name: string;
  phone: string;
  message: string;
};
