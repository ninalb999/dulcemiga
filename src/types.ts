export type OrderPayload = {
  full_name: string;
  phone: string;
  product: string;
  filling: string;
  portions: string;
  delivery_mode: string;
  delivery_date: string;
  message: string;
};

export type ContactPayload = {
  name: string;
  phone: string;
  message: string;
};
