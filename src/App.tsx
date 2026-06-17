import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CakeSlice,
  Check,
  Edit3,
  Facebook,
  Heart,
  Instagram,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import logo from './assets/logo-dulce-miga.jpg';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { CarouselSlide, Dough, Filling, FooterConfig, OrderPayload, PortionPrice, Product } from './types';

type DataStatus = 'idle' | 'loading' | 'success' | 'error';
type AdminTab = 'catalogo' | 'rellenos' | 'masas' | 'carrusel' | 'footer' | 'pedidos';
type AdminFormMode = 'product' | 'filling' | 'dough' | 'slide' | null;

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '12345678';
const STORAGE_BUCKET = 'dulce-miga';
const WHATSAPP_NUMBER = '59160674708';
const WHATSAPP_DISPLAY = '+591 60674708';
const baseUrl = import.meta.env.BASE_URL;
const normalizedBasePath = baseUrl.replace(/\/$/, '');
const adminPath = `${normalizedBasePath}/admin`.replace(/\/+/g, '/');
const catalogPath = `${normalizedBasePath}/catalogo`.replace(/\/+/g, '/');
const catalogHref = `${baseUrl}catalogo`;
const adminHref = `${baseUrl}admin`;
const productHref = (id: string) => `${catalogHref}#producto-${id}`;
const adminFormPath = (mode: Exclude<AdminFormMode, null>) => {
  const suffix = {
    product: null,
    filling: 'rellenos/nuevo',
    dough: 'masas/nuevo',
    slide: 'carrusel/nuevo',
  }[mode];
  if (!suffix) return `${normalizedBasePath}/nuevo`.replace(/\/+/g, '/') || '/nuevo';
  return `${adminPath}/${suffix}`.replace(/\/+/g, '/');
};

const defaultFillings: Filling[] = [
  {
    id: 'relleno-maracuya',
    name: 'Maracuya',
    description: 'Relleno fresco, citrico y aromatico para celebraciones familiares.',
    extra_price: 0,
    color: '#f1b43a',
  },
  {
    id: 'relleno-menta',
    name: 'Menta',
    description: 'Toque refrescante para tortas clasicas con perfil moderno.',
    extra_price: 0,
    color: '#82b99a',
  },
  {
    id: 'relleno-chocolate',
    name: 'Chocolate',
    description: 'Relleno tradicional, intenso y de alta aceptacion.',
    extra_price: 0,
    color: '#6f3e20',
  },
];

const defaultDoughs: Dough[] = [
  {
    id: 'masa-vainilla',
    name: 'Vainilla',
    description: 'Masa clasica suave para tortas tradicionales y decoracion vintage.',
    color: '#ead2a8',
  },
  {
    id: 'masa-chocolate',
    name: 'Chocolate',
    description: 'Masa de cacao para pedidos con sabor intenso y familiar.',
    color: '#6f3e20',
  },
  {
    id: 'masa-naranja',
    name: 'Naranja',
    description: 'Masa aromatica y fresca para celebraciones de dia.',
    color: '#d88b3d',
  },
];

const defaultProducts: Product[] = [
  {
    id: 'torta-vintage',
    name: 'Torta clasica vintage',
    category: 'Tortas personalizadas',
    description: 'Torta tradicional desde 20 porciones con decoracion vintage, dedicatoria y toppers.',
    price: 180,
    portions: '20 porciones',
    portion_options: [
      { label: '20 porciones', price: 180 },
      { label: '25 porciones', price: 220 },
      { label: '30 porciones', price: 260 },
    ],
    image_url: logo,
    filling_ids: ['relleno-maracuya', 'relleno-chocolate'],
    is_featured: true,
  },
  {
    id: 'minitorta-personalizada',
    name: 'Minitorta personalizada',
    category: 'Minitortas',
    description: 'Formato de 6 a 10 porciones para regalos, cumpleanos pequenos y reuniones intimas.',
    price: 85,
    portions: '6 a 10 porciones',
    portion_options: [
      { label: '6 porciones', price: 85 },
      { label: '8 porciones', price: 105 },
      { label: '10 porciones', price: 125 },
    ],
    image_url: logo,
    filling_ids: ['relleno-maracuya', 'relleno-menta', 'relleno-chocolate'],
    is_featured: true,
  },
  {
    id: 'postre-individual',
    name: 'Postres individuales',
    category: 'Postres',
    description: 'Porciones dulces para antojos, meriendas y detalles personalizados.',
    price: 18,
    portions: '1 porcion',
    portion_options: [{ label: '1 porcion', price: 18 }],
    image_url: logo,
    filling_ids: ['relleno-chocolate'],
    is_featured: false,
  },
];

const defaultSlides: CarouselSlide[] = [
  {
    id: 'slide-tortas',
    title: 'Tortas clasicas con estilo vintage',
    subtitle: 'Pedidos personalizados, toppers y rellenos de maracuya, menta o chocolate.',
    image_url: logo,
    target_type: 'Producto',
    target_value: 'torta-vintage',
    is_active: true,
  },
  {
    id: 'slide-minitortas',
    title: 'Minitortas para momentos pequenos',
    subtitle: 'La misma esencia de Dulce Miga en 6 a 10 porciones.',
    image_url: logo,
    target_type: 'Producto',
    target_value: 'minitorta-personalizada',
    is_active: true,
  },
];

const defaultFooter: FooterConfig = {
  brand_text: 'Dulce Miga acompana tus celebraciones con tortas clasicas, rellenos memorables y atencion personalizada.',
  address: 'Pedidos desde domicilio y entregas coordinadas',
  phone: WHATSAPP_DISPLAY,
  whatsapp: WHATSAPP_NUMBER,
  facebook: 'https://facebook.com/',
  instagram: 'https://instagram.com/',
  tiktok: 'https://tiktok.com/',
  copyright: 'Dulce Miga. Todos los derechos reservados.',
};

const emptyFooter: FooterConfig = {
  brand_text: '',
  address: '',
  phone: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  copyright: '',
  schedule: '',
};

const initialOrder: OrderPayload = {
  full_name: '',
  phone: '',
  product: '',
  filling: '',
  fillings: [],
  dough: '',
  doughs: [],
  portions: '',
  selected_price: null,
  delivery_mode: 'Delivery',
  delivery_date: '',
  message: '',
};

const emptyProduct: Product = {
  id: '',
  name: '',
  category: 'Tortas personalizadas',
  description: '',
  price: 0,
  portions: '',
  portion_options: [{ label: '', price: 0 }],
  image_url: '',
  filling_ids: [],
  is_featured: false,
};

const emptyFilling: Filling = {
  id: '',
  name: '',
  description: '',
  extra_price: 0,
  color: '#6f3e20',
};

const emptyDough: Dough = {
  id: '',
  name: '',
  description: '',
  color: '#ead2a8',
};

const emptySlide: CarouselSlide = {
  id: '',
  title: '',
  subtitle: '',
  image_url: '',
  target_type: 'Catalogo',
  target_value: catalogHref,
  is_active: true,
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || crypto.randomUUID();

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const getOrderFillings = (payload: Partial<OrderPayload>) => {
  if (payload.fillings?.length) return payload.fillings;
  if (!payload.filling) return [];
  return payload.filling.split(',').map((item) => item.trim()).filter(Boolean);
};

const getOrderDoughs = (payload: Partial<OrderPayload>) => {
  if (payload.doughs?.length) return payload.doughs;
  if (!payload.dough) return [];
  return payload.dough.split(',').map((item) => item.trim()).filter(Boolean);
};

const getProductPortionOptions = (product: Product): PortionPrice[] => {
  if (Array.isArray(product.portion_options) && product.portion_options.length) {
    return product.portion_options.filter((option) => option.label.trim() && Number(option.price) >= 0);
  }
  if (product.portions) return [{ label: product.portions, price: Number(product.price) || 0 }];
  return [{ label: 'Por definir', price: Number(product.price) || 0 }];
};

const getBaseProductPrice = (product: Product) => getProductPortionOptions(product)[0]?.price ?? product.price ?? 0;

const cleanPortionOptions = (options: PortionPrice[], fallback: Product): PortionPrice[] => {
  const cleaned = options
    .map((option) => ({ label: option.label.trim(), price: Number(option.price) || 0 }))
    .filter((option) => option.label);
  return cleaned.length
    ? cleaned
    : [{ label: fallback.portions || 'Por definir', price: Number(fallback.price) || 0 }];
};

const normalizeProduct = (product: Product): Product => {
  const portionOptions = cleanPortionOptions(product.portion_options ?? [], product);
  return {
    ...product,
    portion_options: portionOptions,
    portions: product.portions || portionOptions[0]?.label || '',
    price: Number(product.price) || portionOptions[0]?.price || 0,
    filling_ids: product.filling_ids ?? [],
  };
};

const normalizeOrder = (payload: Partial<OrderPayload>): OrderPayload => {
  const fillings = getOrderFillings(payload);
  const doughs = getOrderDoughs(payload);
  return {
    ...initialOrder,
    ...payload,
    fillings,
    filling: payload.filling ?? fillings.join(', '),
    doughs,
    dough: payload.dough ?? doughs.join(', '),
    selected_price: payload.selected_price ?? null,
  };
};

const hasSupabaseSession = async () => {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
};

const requireSupabaseSession = async () => {
  if (!supabase) return false;
  if (await hasSupabaseSession()) return true;
  throw new Error('Inicia sesion con el usuario admin de Supabase para guardar cambios permanentes.');
};

const getTargetHref = (slide: CarouselSlide, footer: FooterConfig) => {
  if (slide.target_type === 'Producto') return productHref(slide.target_value);
  if (slide.target_type === 'Catalogo') return catalogHref;
  if (slide.target_type === 'WhatsApp') return footer.whatsapp ? `https://wa.me/${footer.whatsapp}` : '#pedido';
  return slide.target_value || '#inicio';
};

function App() {
  const normalizedPathname = window.location.pathname.replace(/\/$/, '') || '/';
  const routeFormMode: AdminFormMode =
    normalizedPathname === adminFormPath('product')
      ? 'product'
      : normalizedPathname === adminFormPath('filling')
        ? 'filling'
        : normalizedPathname === adminFormPath('dough')
          ? 'dough'
          : normalizedPathname === adminFormPath('slide')
            ? 'slide'
            : null;
  const isAdminRoute = normalizedPathname === adminPath || normalizedPathname.startsWith(`${adminPath}/`) || normalizedPathname === adminFormPath('product');
  const isCatalogRoute = normalizedPathname === catalogPath;
  const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : defaultProducts);
  const [fillings, setFillings] = useState<Filling[]>(isSupabaseConfigured ? [] : defaultFillings);
  const [doughs, setDoughs] = useState<Dough[]>(isSupabaseConfigured ? [] : defaultDoughs);
  const [slides, setSlides] = useState<CarouselSlide[]>(isSupabaseConfigured ? [] : defaultSlides);
  const [footer, setFooter] = useState<FooterConfig>(isSupabaseConfigured ? emptyFooter : defaultFooter);
  const [order, setOrder] = useState<OrderPayload>(initialOrder);
  const [orderStatus, setOrderStatus] = useState<DataStatus>('idle');
  const [orderStep, setOrderStep] = useState(0);
  const [savedOrders, setSavedOrders] = useState<OrderPayload[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [fillingFilter, setFillingFilter] = useState('Todos');
  const [maxPriceFilter, setMaxPriceFilter] = useState('Todos');
  const [selectedCatalogPortions, setSelectedCatalogPortions] = useState<Record<string, string>>({});
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [loginStatus, setLoginStatus] = useState<DataStatus>('idle');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('catalogo');
  const [adminFormMode, setAdminFormMode] = useState<AdminFormMode>(routeFormMode);
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [fillingForm, setFillingForm] = useState<Filling>(emptyFilling);
  const [doughForm, setDoughForm] = useState<Dough>(emptyDough);
  const [slideForm, setSlideForm] = useState<CarouselSlide>(emptySlide);

  const activeSlides = slides.filter((slide) => slide.is_active);
  const firstSlide = activeSlides[0];
  const footerLinks = [
    footer.facebook ? { href: footer.facebook, label: 'Facebook', icon: <Facebook size={17} /> } : null,
    footer.instagram ? { href: footer.instagram, label: 'Instagram', icon: <Instagram size={17} /> } : null,
    footer.tiktok ? { href: footer.tiktok, label: 'TikTok', icon: <Sparkles size={17} /> } : null,
    footer.whatsapp ? { href: `https://wa.me/${footer.whatsapp}`, label: 'WhatsApp', icon: <MessageCircle size={17} /> } : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];
  const selectedProduct = products.find((product) => product.name === order.product);
  const availableFillings = selectedProduct
    ? fillings.filter((filling) => selectedProduct.filling_ids.includes(filling.id))
    : fillings;
  const orderSteps = ['Producto', 'Personalizacion', 'Entrega', 'Confirmacion'];
  const displayedAdminTab: AdminTab =
    adminFormMode === 'product'
      ? 'catalogo'
      : adminFormMode === 'filling'
        ? 'rellenos'
        : adminFormMode === 'dough'
          ? 'masas'
          : adminFormMode === 'slide'
            ? 'carrusel'
            : activeTab;
  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    const maxPrice = maxPriceFilter === 'Todos' ? Number.POSITIVE_INFINITY : Number(maxPriceFilter);

    return products.filter((product) => {
      const productFillings = fillings.filter((filling) => product.filling_ids.includes(filling.id));
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
      const matchesFilling = fillingFilter === 'Todos' || productFillings.some((filling) => filling.name === fillingFilter);
      const matchesPrice = Math.min(...getProductPortionOptions(product).map((option) => option.price)) <= maxPrice;
      return matchesSearch && matchesCategory && matchesFilling && matchesPrice;
    });
  }, [catalogSearch, categoryFilter, fillingFilter, fillings, maxPriceFilter, products]);

  const getCatalogPortionOption = (product: Product) => {
    const options = getProductPortionOptions(product);
    return options.find((option) => option.label === selectedCatalogPortions[product.id]) ?? options[0];
  };

  const buildOrderForProduct = (product: Product, portionOption = getProductPortionOptions(product)[0]) => {
    const productFillings = fillings.filter((filling) => product.filling_ids.includes(filling.id));
    const selectedFillings = productFillings.slice(0, 1).map((filling) => filling.name);
    return {
      ...order,
      product: product.name,
      portions: portionOption?.label ?? product.portions,
      selected_price: portionOption?.price ?? getBaseProductPrice(product),
      fillings: selectedFillings,
      filling: selectedFillings.join(', '),
      doughs: order.doughs.length ? order.doughs : doughs[0]?.name ? [doughs[0].name] : [],
      dough: (order.doughs.length ? order.doughs : doughs[0]?.name ? [doughs[0].name] : []).join(', '),
    };
  };

  const storePendingProductOrder = (product: Product, portionOption = getProductPortionOptions(product)[0]) => {
    saveLocal('dulce-miga-pending-order', buildOrderForProduct(product, portionOption));
  };

  const buildWhatsappUrl = (payload: OrderPayload) => {
    const product = products.find((item) => item.name === payload.product);
    const lines = [
      'Hola Dulce Miga, quiero realizar una reserva con estos datos:',
      `Cliente: ${payload.full_name || 'Sin nombre'}`,
      `WhatsApp del cliente: ${payload.phone || 'Sin WhatsApp'}`,
      `Producto: ${payload.product || 'Sin seleccionar'}`,
      `Precio referencial: ${payload.selected_price ? `Bs. ${payload.selected_price}` : product ? `Bs. ${getBaseProductPrice(product)}` : 'Por confirmar'}`,
      `Masas: ${getOrderDoughs(payload).join(', ') || 'Sin seleccionar'}`,
      `Rellenos: ${getOrderFillings(payload).join(', ') || 'Sin seleccionar'}`,
      `Porciones: ${payload.portions || 'Sin definir'}`,
      `Modalidad: ${payload.delivery_mode || 'Por coordinar'}`,
      `Fecha requerida: ${payload.delivery_date || 'Por confirmar'}`,
      `Detalles: ${payload.message || 'Sin detalle adicional'}`,
    ];

    if (!footer.whatsapp) return '';
    return `https://wa.me/${footer.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        setProducts(readLocal('dulce-miga-products', defaultProducts).map(normalizeProduct));
        setFillings(readLocal('dulce-miga-fillings', defaultFillings));
        setDoughs(readLocal('dulce-miga-doughs', defaultDoughs));
        setSlides(readLocal('dulce-miga-slides', defaultSlides));
        setFooter(readLocal('dulce-miga-footer', defaultFooter));
        setSavedOrders(readLocal<Partial<OrderPayload>[]>('dulce-miga-orders', []).map(normalizeOrder));
        return;
      }

      const [productResult, fillingResult, doughResult, slideResult, footerResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: true }),
        supabase.from('fillings').select('*').order('created_at', { ascending: true }),
        supabase.from('doughs').select('*').order('created_at', { ascending: true }),
        supabase.from('carousel_slides').select('*').order('created_at', { ascending: true }),
        supabase.from('footer_config').select('*').limit(1).maybeSingle(),
      ]);

      if (!productResult.error) setProducts(((productResult.data ?? []) as Product[]).map(normalizeProduct));
      if (!fillingResult.error) setFillings((fillingResult.data ?? []) as Filling[]);
      if (!doughResult.error) setDoughs((doughResult.data ?? []) as Dough[]);
      if (!slideResult.error) setSlides((slideResult.data ?? []) as CarouselSlide[]);
      if (!footerResult.error) setFooter(footerResult.data ? (footerResult.data as FooterConfig) : emptyFooter);
      setSavedOrders(readLocal<Partial<OrderPayload>[]>('dulce-miga-orders', []).map(normalizeOrder));
    };

    loadData().catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    const pendingOrder = readLocal<OrderPayload | null>('dulce-miga-pending-order', null);
    if (!pendingOrder?.product) return;
    setOrder((current) => ({ ...current, ...pendingOrder }));
    setOrderStep(1);
    localStorage.removeItem('dulce-miga-pending-order');
  }, []);

  useEffect(() => {
    const loadSavedOrders = async () => {
      if (!adminAuthed || !supabase) return;
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!error && data) setSavedOrders((data as Partial<OrderPayload>[]).map(normalizeOrder));
    };

    loadSavedOrders().catch((error) => console.error(error));
  }, [adminAuthed]);

  useEffect(() => {
    if (!order.product && products[0]) {
      const options = getProductPortionOptions(products[0]);
      const firstDough = doughs[0]?.name ? [doughs[0].name] : [];
      setOrder((current) => ({
        ...current,
        product: products[0].name,
        portions: options[0]?.label ?? products[0].portions,
        selected_price: options[0]?.price ?? getBaseProductPrice(products[0]),
        fillings: fillings[0]?.name ? [fillings[0].name] : [],
        filling: fillings[0]?.name ?? '',
        doughs: firstDough,
        dough: firstDough.join(', '),
      }));
    }
  }, [doughs, fillings, order.product, products]);

  const isOrderReady = () =>
    Boolean(order.product && order.doughs.length && order.fillings.length && order.portions && order.full_name && order.phone && order.delivery_date);

  const updateOrder = (field: keyof OrderPayload, value: string) => {
    setOrder((current) => ({ ...current, [field]: value }));
  };

  const toggleOrderFilling = (name: string) => {
    setOrder((current) => {
      const exists = current.fillings.includes(name);
      const nextFillings = exists
        ? current.fillings.filter((item) => item !== name)
        : current.fillings.length < 2
          ? [...current.fillings, name]
          : current.fillings;
      return {
        ...current,
        fillings: nextFillings,
        filling: nextFillings.join(', '),
      };
    });
  };

  const toggleOrderDough = (name: string) => {
    setOrder((current) => {
      const exists = current.doughs.includes(name);
      const nextDoughs = exists
        ? current.doughs.filter((item) => item !== name)
        : current.doughs.length < 3
          ? [...current.doughs, name]
          : current.doughs;
      return {
        ...current,
        doughs: nextDoughs,
        dough: nextDoughs.join(', '),
      };
    });
  };

  const canGoNext = () => {
    if (orderStep === 0) return Boolean(order.product);
    if (orderStep === 1) return Boolean(order.doughs.length && order.doughs.length <= 3 && order.fillings.length && order.fillings.length <= 2 && order.portions);
    if (orderStep === 2) return Boolean(order.full_name && order.phone && order.delivery_date);
    return isOrderReady();
  };

  const nextOrderStep = () => {
    if (!canGoNext()) return;
    setOrderStep((current) => Math.min(current + 1, orderSteps.length - 1));
  };

  const previousOrderStep = () => {
    setOrderStep((current) => Math.max(current - 1, 0));
  };

  const goToOrderStep = (index: number) => {
    if (index <= orderStep) {
      setOrderStep(index);
      return;
    }
    if (index === orderStep + 1 && canGoNext()) {
      setOrderStep(index);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    if (!supabase) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    await requireSupabaseSession();
    const path = `${folder}/${Date.now()}-${slug(file.name)}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
    folder: string,
    onReady: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await uploadImage(file, folder);
      onReady(imageUrl);
    } catch (error) {
      console.error(error);
      alert('No se pudo subir la imagen. Revisa el bucket de Supabase.');
    }
  };

  const loginAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginStatus('loading');
    setLoginError('');
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        throw new Error('Credenciales incorrectas');
      }

      setAdminAuthed(true);
      setLoginStatus('success');
    } catch (error) {
      setLoginError(
        supabase
          ? 'No se pudo iniciar sesion en Supabase. Verifica que exista el usuario admin@gmail.com en Authentication.'
          : error instanceof Error
            ? error.message
            : 'No se pudo iniciar sesion',
      );
      setLoginStatus('error');
    }
  };

  const logoutAdmin = async () => {
    if (supabase) await supabase.auth.signOut();
    setAdminAuthed(false);
  };

  const openAdminForm = (mode: Exclude<AdminFormMode, null>, item?: Product | Filling | Dough | CarouselSlide) => {
    if (mode === 'product') setProductForm(item ? normalizeProduct(item as Product) : emptyProduct);
    if (mode === 'filling') setFillingForm(item ? (item as Filling) : emptyFilling);
    if (mode === 'dough') setDoughForm(item ? (item as Dough) : emptyDough);
    if (mode === 'slide') setSlideForm(item ? (item as CarouselSlide) : emptySlide);
    setAdminFormMode(mode);
    window.history.pushState(null, '', adminFormPath(mode));
  };

  const closeAdminForm = () => {
    setAdminFormMode(null);
    setProductForm(emptyProduct);
    setFillingForm(emptyFilling);
    setDoughForm(emptyDough);
    setSlideForm(emptySlide);
    window.history.pushState(null, '', adminHref);
  };

  const updatePortionOption = (index: number, field: keyof PortionPrice, value: string) => {
    const next = [...productForm.portion_options];
    next[index] = {
      ...next[index],
      [field]: field === 'price' ? Number(value) : value,
    };
    setProductForm({ ...productForm, portion_options: next });
  };

  const addPortionOption = () => {
    setProductForm({ ...productForm, portion_options: [...productForm.portion_options, { label: '', price: 0 }] });
  };

  const removePortionOption = (index: number) => {
    const next = productForm.portion_options.filter((_, optionIndex) => optionIndex !== index);
    setProductForm({ ...productForm, portion_options: next.length ? next : [{ label: '', price: 0 }] });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const portionOptions = cleanPortionOptions(productForm.portion_options, productForm);
    const product = normalizeProduct({
      ...productForm,
      id: productForm.id || slug(productForm.name),
      image_url: productForm.image_url || logo,
      portions: portionOptions[0]?.label || productForm.portions,
      price: portionOptions[0]?.price ?? productForm.price,
      portion_options: portionOptions,
    });
    const next = products.some((item) => item.id === product.id)
      ? products.map((item) => (item.id === product.id ? product : item))
      : [...products, product];
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('products').upsert(product);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-products', next);
      }
      setProducts(next);
      closeAdminForm();
    } catch (error) {
      console.error(error);
      alert('No se guardo el producto en Supabase. Revisa la sesion del admin o las politicas de la base de datos.');
    }
  };

  const deleteProduct = async (id: string) => {
    const next = products.filter((item) => item.id !== id);
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-products', next);
      }
      setProducts(next);
    } catch (error) {
      console.error(error);
      alert('No se elimino el producto en Supabase.');
    }
  };

  const saveFilling = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filling = { ...fillingForm, id: fillingForm.id || slug(fillingForm.name), extra_price: 0 };
    const next = fillings.some((item) => item.id === filling.id)
      ? fillings.map((item) => (item.id === filling.id ? filling : item))
      : [...fillings, filling];
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('fillings').upsert(filling);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-fillings', next);
      }
      setFillings(next);
      closeAdminForm();
    } catch (error) {
      console.error(error);
      alert('No se guardo el relleno en Supabase.');
    }
  };

  const deleteFilling = async (id: string) => {
    const next = fillings.filter((item) => item.id !== id);
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('fillings').delete().eq('id', id);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-fillings', next);
      }
      setFillings(next);
    } catch (error) {
      console.error(error);
      alert('No se elimino el relleno en Supabase.');
    }
  };

  const saveDough = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dough = { ...doughForm, id: doughForm.id || slug(doughForm.name) };
    const next = doughs.some((item) => item.id === dough.id)
      ? doughs.map((item) => (item.id === dough.id ? dough : item))
      : [...doughs, dough];
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('doughs').upsert(dough);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-doughs', next);
      }
      setDoughs(next);
      closeAdminForm();
    } catch (error) {
      console.error(error);
      alert('No se guardo la masa en Supabase.');
    }
  };

  const deleteDough = async (id: string) => {
    const next = doughs.filter((item) => item.id !== id);
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('doughs').delete().eq('id', id);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-doughs', next);
      }
      setDoughs(next);
    } catch (error) {
      console.error(error);
      alert('No se elimino la masa en Supabase.');
    }
  };

  const saveSlide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slide = { ...slideForm, id: slideForm.id || `slide-${Date.now()}`, image_url: slideForm.image_url || logo };
    const next = slides.some((item) => item.id === slide.id)
      ? slides.map((item) => (item.id === slide.id ? slide : item))
      : [...slides, slide];
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('carousel_slides').upsert(slide);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-slides', next);
      }
      setSlides(next);
      closeAdminForm();
    } catch (error) {
      console.error(error);
      alert('No se guardo el carrusel en Supabase.');
    }
  };

  const deleteSlide = async (id: string) => {
    const next = slides.filter((item) => item.id !== id);
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('carousel_slides').delete().eq('id', id);
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-slides', next);
      }
      setSlides(next);
    } catch (error) {
      console.error(error);
      alert('No se elimino el carrusel en Supabase.');
    }
  };

  const saveFooter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (supabase) {
        await requireSupabaseSession();
        const { error } = await supabase.from('footer_config').upsert({ id: 'main', ...footer });
        if (error) throw error;
      } else {
        saveLocal('dulce-miga-footer', footer);
      }
      alert('Footer actualizado');
    } catch (error) {
      console.error(error);
      alert('No se guardo el footer en Supabase.');
    }
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canGoNext()) return;
    if (!footer.whatsapp) {
      setOrderStatus('error');
      return;
    }

    const payload = normalizeOrder({ ...order, filling: order.fillings.join(', ') });
    const dbPayload = {
      ...payload,
      delivery_date: payload.delivery_date || null,
    };
    setOrderStatus('loading');

    try {
      let savedInSupabase = false;
      if (supabase) {
        const { error } = await supabase.from('orders').insert(dbPayload);
        if (error) throw error;
        savedInSupabase = true;
      }

      const localOrders = readLocal<OrderPayload[]>('dulce-miga-orders', []);
      const nextOrders = [{ ...payload }, ...localOrders];
      saveLocal('dulce-miga-orders', nextOrders);
      setSavedOrders((current) => [{ ...payload }, ...current]);
      setOrderStatus('success');
      if (!savedInSupabase && supabase) {
        console.warn('Pedido guardado localmente porque Supabase no permitio la insercion.');
      }

      const whatsappUrl = buildWhatsappUrl(payload);
      window.location.assign(whatsappUrl);
    } catch (error) {
      console.error(error);
      setOrderStatus('error');
    }
  };

  if (isAdminRoute) {
    return (
      <main className="admin-page">
        <header className="site-header">
          <a className="brand" href={baseUrl}>
            <img src={logo} alt="Logo Dulce Miga" />
            <span>Dulce Miga Admin</span>
          </a>
          <nav>
            <a href={baseUrl}>Vista publica</a>
            {adminAuthed && (
              <button className="text-button" onClick={logoutAdmin} type="button">
                <LogOut size={16} /> Salir
              </button>
            )}
          </nav>
        </header>

        {!adminAuthed ? (
          <section className="admin-login">
            <form onSubmit={loginAdmin}>
              <img src={logo} alt="" />
              <h1>Panel administrativo</h1>
              <p>Gestiona catalogo, carrusel, sabores, footer y pedidos de Dulce Miga.</p>
              <label>
                Correo
                <input name="email" defaultValue={ADMIN_EMAIL} type="email" required />
              </label>
              <label>
                Contrasena
                <input name="password" defaultValue={ADMIN_PASSWORD} type="password" required />
              </label>
              <button className="primary-button" disabled={loginStatus === 'loading'} type="submit">
                {loginStatus === 'loading' ? 'Ingresando...' : 'Ingresar'}
              </button>
              {loginError && <p className="form-status error">{loginError}</p>}
            </form>
          </section>
        ) : (
          <section className="admin-shell">
            <aside className="admin-sidebar">
              {[
                ['catalogo', 'Catalogo de tortas'],
                ['rellenos', 'Rellenos'],
                ['masas', 'Masas'],
                ['carrusel', 'Carrusel'],
                ['footer', 'Footer y redes'],
                ['pedidos', 'Pedidos'],
              ].map(([key, label]) => (
                <button
                  className={displayedAdminTab === key ? 'active' : ''}
                  key={key}
                  onClick={() => {
                    setActiveTab(key as AdminTab);
                    setAdminFormMode(null);
                    window.history.pushState(null, '', adminHref);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </aside>

            <div className="admin-content">
              {displayedAdminTab === 'catalogo' && (
                <AdminPanel title="Catalogo de tortas y postres" description="Productos visibles en el catalogo publico.">
                  {adminFormMode === 'product' ? (
                  <form className="admin-form" onSubmit={saveProduct}>
                    <label>
                      Nombre
                      <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                    </label>
                    <label>
                      Categoria
                      <input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                    </label>
                    <div className="portion-editor full-row">
                      <div>
                        <strong>Porciones permitidas y precios</strong>
                        <button className="secondary-button small-button" type="button" onClick={addPortionOption}>
                          <Plus size={15} /> Agregar porcion
                        </button>
                      </div>
                      {productForm.portion_options.map((option, index) => (
                        <div className="portion-row" key={`portion-option-${index}`}>
                          <label>
                            Porciones
                            <input
                              placeholder="Ej. 20 porciones"
                              value={option.label}
                              onChange={(e) => updatePortionOption(index, 'label', e.target.value)}
                            />
                          </label>
                          <label>
                            Precio Bs.
                            <input
                              min="0"
                              type="number"
                              value={option.price}
                              onChange={(e) => updatePortionOption(index, 'price', e.target.value)}
                            />
                          </label>
                          <button className="icon-button danger" type="button" onClick={() => removePortionOption(index)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="full-row">
                      Descripcion
                      <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                    </label>
                    <label>
                      Imagen
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'productos', (url) => setProductForm({ ...productForm, image_url: url }))} />
                    </label>
                    <label>
                      URL imagen
                      <input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} />
                    </label>
                    <div className="check-grid full-row">
                      {fillings.map((filling) => (
                        <label key={filling.id}>
                          <input
                            checked={productForm.filling_ids.includes(filling.id)}
                            type="checkbox"
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...productForm.filling_ids, filling.id]
                                : productForm.filling_ids.filter((id) => id !== filling.id);
                              setProductForm({ ...productForm, filling_ids: next });
                            }}
                          />
                          {filling.name}
                        </label>
                      ))}
                    </div>
                    <label className="inline-check">
                      <input checked={productForm.is_featured} type="checkbox" onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })} />
                      Producto destacado
                    </label>
                    <div className="form-actions full-row">
                      <button className="secondary-button" type="button" onClick={closeAdminForm}>Cancelar</button>
                      <button className="primary-button" type="submit"><Save size={17} /> Guardar producto</button>
                    </div>
                  </form>
                  ) : (
                  <>
                    <div className="admin-list-actions">
                      <p>Listado de productos creados. Usa el boton para abrir el formulario en una ruta independiente.</p>
                      <button className="primary-button" type="button" onClick={() => openAdminForm('product')}>
                        <Plus size={17} /> Crear nuevo
                      </button>
                    </div>
                  <CrudList>
                    {products.map((product) => (
                      <article key={product.id}>
                        <img src={product.image_url || logo} alt="" />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.category} - desde Bs. {getBaseProductPrice(product)}</span>
                        </div>
                        <button type="button" onClick={() => openAdminForm('product', product)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                  </>
                  )}
                </AdminPanel>
              )}

              {displayedAdminTab === 'rellenos' && (
                <AdminPanel title="Rellenos" description="Administra sabores y descripciones incluidos en el precio de cada torta.">
                  {adminFormMode === 'filling' ? (
                  <form className="admin-form" onSubmit={saveFilling}>
                    <label>
                      Nombre
                      <input value={fillingForm.name} onChange={(e) => setFillingForm({ ...fillingForm, name: e.target.value })} required />
                    </label>
                    <label>
                      Color
                      <input type="color" value={fillingForm.color} onChange={(e) => setFillingForm({ ...fillingForm, color: e.target.value })} />
                    </label>
                    <label className="full-row">
                      Descripcion
                      <textarea value={fillingForm.description} onChange={(e) => setFillingForm({ ...fillingForm, description: e.target.value })} />
                    </label>
                    <div className="form-actions full-row">
                      <button className="secondary-button" type="button" onClick={closeAdminForm}>Cancelar</button>
                      <button className="primary-button" type="submit"><Save size={17} /> Guardar relleno</button>
                    </div>
                  </form>
                  ) : (
                  <>
                  <div className="admin-list-actions">
                    <p>Listado de rellenos disponibles para seleccionar al hacer un pedido.</p>
                    <button className="primary-button" type="button" onClick={() => openAdminForm('filling')}>
                      <Plus size={17} /> Crear nuevo
                    </button>
                  </div>
                  <CrudList>
                    {fillings.map((filling) => (
                      <article key={filling.id}>
                        <span className="color-dot" style={{ background: filling.color }} />
                        <div>
                          <strong>{filling.name}</strong>
                          <span>Incluido en el precio de la torta</span>
                        </div>
                        <button type="button" onClick={() => openAdminForm('filling', filling)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteFilling(filling.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                  </>
                  )}
                </AdminPanel>
              )}

              {displayedAdminTab === 'masas' && (
                <AdminPanel title="Masas" description="Administra los sabores de masa disponibles para cada pedido.">
                  {adminFormMode === 'dough' ? (
                  <form className="admin-form" onSubmit={saveDough}>
                    <label>
                      Nombre
                      <input value={doughForm.name} onChange={(e) => setDoughForm({ ...doughForm, name: e.target.value })} required />
                    </label>
                    <label>
                      Color
                      <input type="color" value={doughForm.color} onChange={(e) => setDoughForm({ ...doughForm, color: e.target.value })} />
                    </label>
                    <label className="full-row">
                      Descripcion
                      <textarea value={doughForm.description} onChange={(e) => setDoughForm({ ...doughForm, description: e.target.value })} />
                    </label>
                    <div className="form-actions full-row">
                      <button className="secondary-button" type="button" onClick={closeAdminForm}>Cancelar</button>
                      <button className="primary-button" type="submit"><Save size={17} /> Guardar masa</button>
                    </div>
                  </form>
                  ) : (
                  <>
                  <div className="admin-list-actions">
                    <p>Listado de masas disponibles para seleccionar al hacer un pedido.</p>
                    <button className="primary-button" type="button" onClick={() => openAdminForm('dough')}>
                      <Plus size={17} /> Crear nuevo
                    </button>
                  </div>
                  <CrudList>
                    {doughs.map((dough) => (
                      <article key={dough.id}>
                        <span className="color-dot" style={{ background: dough.color }} />
                        <div>
                          <strong>{dough.name}</strong>
                          <span>{dough.description || 'Sin descripcion'}</span>
                        </div>
                        <button type="button" onClick={() => openAdminForm('dough', dough)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteDough(dough.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                  </>
                  )}
                </AdminPanel>
              )}

              {displayedAdminTab === 'carrusel' && (
                <AdminPanel title="Carrusel principal" description="Sube imagenes y define a donde dirige cada slide.">
                  {adminFormMode === 'slide' ? (
                  <form className="admin-form" onSubmit={saveSlide}>
                    <label>
                      Titulo
                      <input value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} required />
                    </label>
                    <label>
                      Direccionamiento
                      <select
                        value={slideForm.target_type}
                        onChange={(e) => setSlideForm({ ...slideForm, target_type: e.target.value as CarouselSlide['target_type'], target_value: '' })}
                      >
                        <option>Producto</option>
                        <option>Catalogo</option>
                        <option>WhatsApp</option>
                        <option>Personalizado</option>
                      </select>
                    </label>
                    {slideForm.target_type === 'Producto' ? (
                      <label>
                        Producto destino
                        <select value={slideForm.target_value} onChange={(e) => setSlideForm({ ...slideForm, target_value: e.target.value })}>
                          <option value="">Seleccionar</option>
                          {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                        </select>
                      </label>
                    ) : (
                      <label>
                        Valor destino
                        <input
                          placeholder={slideForm.target_type === 'WhatsApp' ? WHATSAPP_NUMBER : `${catalogHref} o https://...`}
                          value={slideForm.target_value}
                          onChange={(e) => setSlideForm({ ...slideForm, target_value: e.target.value })}
                        />
                      </label>
                    )}
                    <label className="full-row">
                      Subtitulo
                      <textarea value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} />
                    </label>
                    <label>
                      Imagen
                      <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'carrusel', (url) => setSlideForm({ ...slideForm, image_url: url }))} />
                    </label>
                    <label>
                      URL imagen
                      <input value={slideForm.image_url} onChange={(e) => setSlideForm({ ...slideForm, image_url: e.target.value })} />
                    </label>
                    <label className="inline-check">
                      <input checked={slideForm.is_active} type="checkbox" onChange={(e) => setSlideForm({ ...slideForm, is_active: e.target.checked })} />
                      Visible
                    </label>
                    <div className="form-actions full-row">
                      <button className="secondary-button" type="button" onClick={closeAdminForm}>Cancelar</button>
                      <button className="primary-button" type="submit"><Upload size={17} /> Guardar slide</button>
                    </div>
                  </form>
                  ) : (
                  <>
                  <div className="admin-list-actions">
                    <p>Listado de slides del carrusel principal.</p>
                    <button className="primary-button" type="button" onClick={() => openAdminForm('slide')}>
                      <Plus size={17} /> Crear nuevo
                    </button>
                  </div>
                  <CrudList>
                    {slides.map((slide) => (
                      <article key={slide.id}>
                        <img src={slide.image_url || logo} alt="" />
                        <div>
                          <strong>{slide.title}</strong>
                          <span>{slide.target_type}: {slide.target_value || 'sin destino'}</span>
                        </div>
                        <button type="button" onClick={() => openAdminForm('slide', slide)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteSlide(slide.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                  </>
                  )}
                </AdminPanel>
              )}

              {displayedAdminTab === 'footer' && (
                <AdminPanel title="Footer y redes sociales" description="Personaliza datos de contacto y enlaces visibles al publico.">
                  <form className="admin-form" onSubmit={saveFooter}>
                    {Object.entries(footer).map(([key, value]) => (
                      <label className={key === 'brand_text' ? 'full-row' : ''} key={key}>
                        {key.replace('_', ' ')}
                        <input value={value} onChange={(e) => setFooter({ ...footer, [key]: e.target.value })} />
                      </label>
                    ))}
                    <button className="primary-button" type="submit"><Save size={17} /> Guardar footer</button>
                  </form>
                </AdminPanel>
              )}

              {displayedAdminTab === 'pedidos' && (
                <AdminPanel title="Pedidos registrados" description="Solicitudes enviadas desde el flujo de reserva.">
                  <CrudList>
                    {savedOrders.length ? (
                      savedOrders.map((item, index) => (
                        <article key={`${item.phone}-${item.delivery_date}-${index}`}>
                          <MessageCircle size={24} />
                          <div>
                            <strong>{item.product} - {item.full_name}</strong>
                            <span>
                              {item.phone} | {item.delivery_date || 'sin fecha'} | {item.delivery_mode}
                            </span>
                            <span>
                              Masas: {getOrderDoughs(item).join(', ') || 'sin definir'} | Rellenos: {getOrderFillings(item).join(', ') || 'sin definir'} | Porciones: {item.portions || 'sin definir'} | Bs. {item.selected_price ?? 'por confirmar'}
                            </span>
                            <span>{item.message || 'Sin detalles adicionales'}</span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">Todavia no hay pedidos registrados.</p>
                    )}
                  </CrudList>
                </AdminPanel>
              )}
            </div>
          </section>
        )}
      </main>
    );
  }

  if (isCatalogRoute) {
    return (
      <main>
        <header className="site-header">
          <a className="brand" href={baseUrl} aria-label="Inicio Dulce Miga">
            <img src={logo} alt="Logo Dulce Miga" />
            <span>Dulce Miga</span>
          </a>
          <nav aria-label="Navegacion principal">
            <a href={baseUrl}>Inicio</a>
            <a href={catalogHref}>Catalogo</a>
            <a href={`${baseUrl}#pedido`}>Pedido</a>
          </nav>
        </header>

        <section className="section catalog-page">
          <div className="section-heading catalog-page-heading">
            <div>
              <p className="eyebrow">Catalogo completo</p>
              <h1>Tortas y postres de Dulce Miga</h1>
              <p>
                Explora productos disponibles, filtra por tipo, relleno o precio y luego inicia
                tu reserva para coordinarla por WhatsApp.
              </p>
            </div>
            <a className="secondary-button" href={`${baseUrl}#pedido`}>
              <Send size={18} /> Como pedir
            </a>
          </div>

          <div className="catalog-filters" aria-label="Filtros del catalogo">
            <label>
              Buscar
              <input
                placeholder="Torta vintage, postre, minitorta..."
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
              />
            </label>
            <label>
              Categoria
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Relleno
              <select value={fillingFilter} onChange={(event) => setFillingFilter(event.target.value)}>
                <option>Todos</option>
                {fillings.map((filling) => <option key={filling.id}>{filling.name}</option>)}
              </select>
            </label>
            <label>
              Precio maximo
              <select value={maxPriceFilter} onChange={(event) => setMaxPriceFilter(event.target.value)}>
                <option>Todos</option>
                <option value="50">Hasta Bs. 50</option>
                <option value="100">Hasta Bs. 100</option>
                <option value="200">Hasta Bs. 200</option>
              </select>
            </label>
          </div>

          <div className="product-grid catalog-grid catalog-route-grid">
            {filteredProducts.length ? (
              filteredProducts.map((product) => {
                const portionOptions = getProductPortionOptions(product);
                const selectedOption = getCatalogPortionOption(product);
                return (
                  <article className="product-card catalog-card" id={`producto-${product.id}`} key={product.id}>
                    <img src={product.image_url || logo} alt={product.name} />
                    <div className="product-meta">
                      <span>{product.category}</span>
                      {product.is_featured && <small>Destacado</small>}
                    </div>
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <label className="compact-select">
                      Porciones
                      <select
                        value={selectedOption?.label ?? ''}
                        onChange={(event) => setSelectedCatalogPortions((current) => ({ ...current, [product.id]: event.target.value }))}
                      >
                        {portionOptions.map((option) => (
                          <option key={`${product.id}-${option.label}`} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="product-bottom">
                      <strong>Bs. {selectedOption?.price ?? getBaseProductPrice(product)}</strong>
                      <span>{selectedOption?.label ?? product.portions}</span>
                    </div>
                    <div className="chips">
                      {fillings
                        .filter((filling) => product.filling_ids.includes(filling.id))
                        .map((filling) => <span key={filling.id}>{filling.name}</span>)}
                    </div>
                    <a
                      className="primary-button product-reserve-link"
                      href={`${baseUrl}#pedido`}
                      onClick={() => storePendingProductOrder(product, selectedOption)}
                    >
                      <Send size={17} /> Reservar este producto
                    </a>
                  </article>
                );
              })
            ) : (
              <p className="empty-state full-row">
                {products.length
                  ? 'No hay productos que coincidan con los filtros seleccionados.'
                  : 'Aun no hay productos cargados desde admin.'}
              </p>
            )}
          </div>
        </section>

        <footer>
          <div>
            <img src={logo} alt="" />
            {footer.brand_text && <p>{footer.brand_text}</p>}
          </div>
          {footer.address && <p>{footer.address}</p>}
          {footer.phone && <p>{footer.phone}</p>}
          {footerLinks.length > 0 && (
            <div className="social-links">
              {footerLinks.map((link) => (
                <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
                  {link.icon} {link.label}
                </a>
              ))}
            </div>
          )}
          {footer.copyright && <small>{footer.copyright}</small>}
        </footer>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Inicio Dulce Miga">
          <img src={logo} alt="Logo Dulce Miga" />
          <span>Dulce Miga</span>
        </a>
        <nav aria-label="Navegacion principal">
          <a href="#inicio">Inicio</a>
          <a href={catalogHref}>Catalogo</a>
          <a href="#pedido">Pedido</a>
        </nav>
      </header>

      <section className="hero bakery-hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Dulce Miga</p>
          <h1>{firstSlide?.title || 'Catalogo pendiente de configurar'}</h1>
          <p>{firstSlide?.subtitle || footer.brand_text || 'Carga productos y carrusel desde el panel administrativo.'}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#pedido"><Send size={18} /> Cotizar por WhatsApp</a>
            <a className="secondary-button" href={catalogHref}>Ver catalogo</a>
          </div>
        </div>
        {firstSlide ? (
          <article className="carousel-card">
            <img src={firstSlide.image_url || logo} alt={firstSlide.title} />
            <div>
              <span>Promocion destacada</span>
              <p>{firstSlide.subtitle}</p>
              <a className="secondary-button" href={getTargetHref(firstSlide, footer)}>Ver detalle</a>
            </div>
          </article>
        ) : (
          <article className="carousel-card empty-state">
            <img src={logo} alt="" />
            <div>
              <span>Sin carrusel activo</span>
              <h2>Agrega slides desde admin</h2>
              <p>Los datos visibles se cargaran desde Supabase cuando los registres.</p>
            </div>
          </article>
        )}
      </section>

      {activeSlides.length > 0 && (
        <section className="carousel-strip" aria-label="Promociones">
          {activeSlides.map((slide) => (
            <a className="mini-slide" href={getTargetHref(slide, footer)} key={slide.id}>
              <img src={slide.image_url || logo} alt="" />
              <div>
                <strong>{slide.title}</strong>
                <span>{slide.target_type}</span>
              </div>
            </a>
          ))}
        </section>
      )}

      <section className="section identity-section" aria-label="Identidad de Dulce Miga">
        <div className="section-heading">
          <p className="eyebrow">Inicio</p>
          <h2>Identidad estrategica de Dulce Miga</h2>
          <p>
            Dulce Miga es una microempresa de pasteleria tradicional enfocada en pedidos personalizados,
            atencion cercana y crecimiento digital para llegar a nuevos clientes.
          </p>
        </div>
        <div className="identity-grid">
          <article>
            <h3>Mision</h3>
            <p>Elaborar tortas y postres personalizados con sabor casero, presentacion cuidada y una atencion calida en cada pedido.</p>
          </article>
          <article>
            <h3>Vision</h3>
            <p>Consolidarse como una pasteleria reconocida por tortas clasicas, decoracion vintage y un servicio digital confiable.</p>
          </article>
          <article>
            <h3>Objetivos</h3>
            <p>Ampliar el catalogo, organizar los pedidos desde canales digitales y preparar la expansion futura hacia un punto de recojo o local.</p>
          </article>
          <article>
            <h3>Valores</h3>
            <p>Responsabilidad, confianza, creatividad, higiene, puntualidad y trato personalizado con cada cliente.</p>
          </article>
        </div>
      </section>

      <section className="section catalog-entry" id="catalogo">
        <div className="section-heading">
          <p className="eyebrow">Catalogo independiente</p>
          <h2>Elige primero, reserva despues</h2>
          <p>
            El catalogo ahora esta en una ruta propia con filtros por categoria, relleno y precio
            para que el cliente encuentre su torta antes de iniciar el pedido.
          </p>
          <a className="primary-button" href={catalogHref}>
            <CakeSlice size={18} /> Abrir catalogo completo
          </a>
        </div>
      </section>

      <section className="section service-public compact-process" id="servicio">
        <div className="section-heading">
          <p className="eyebrow">Como funciona</p>
          <h2>Pedido en tres pasos</h2>
        </div>
        <div className="flow-grid">
          {['Elige producto y sabores', 'Confirma datos y fecha', 'Envia el resumen por WhatsApp'].map((step, index) => (
            <article className="flow-step" key={step}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <Check size={20} />
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="order-section" id="pedido">
        <div className="order-copy">
          <p className="eyebrow">Pedidos personalizados</p>
          <h2>Cotiza tu torta</h2>
          <p>
            Completa la reserva paso a paso. Al finalizar se guardan tus datos y se abre WhatsApp
            con el resumen exacto del producto, masa, rellenos, fecha y detalles que escribiste.
          </p>
          <ol className="order-process-list">
            <li>Selecciona el producto del catalogo.</li>
            <li>Define masa, hasta dos rellenos, porciones, decoracion y toppers.</li>
            <li>Registra nombre, WhatsApp, fecha y modalidad.</li>
            <li>Confirma y envia el pedido al WhatsApp de Dulce Miga.</li>
          </ol>
          {footer.phone && <p className="whatsapp-contact">WhatsApp de pedidos: {footer.phone}</p>}
        </div>

        <form className="order-form stepper-form" onSubmit={submitOrder}>
          <div className="reservation-stepper full-row" aria-label="Pasos de reserva">
            {orderSteps.map((step, index) => (
              <button
                className={index === orderStep ? 'active' : index < orderStep ? 'done' : ''}
                key={step}
                onClick={() => goToOrderStep(index)}
                type="button"
              >
                <span>{index < orderStep ? <Check size={16} /> : index + 1}</span>
                {step}
              </button>
            ))}
          </div>

          {orderStep === 0 && (
            <div className="step-panel full-row">
              <div className="step-title">
                <p className="eyebrow">Paso 1</p>
                <h3>Elige el producto para tu reserva</h3>
              </div>
              <div className="reserve-product-grid">
                {products.length ? (
                  products.map((product) => {
                    const options = getProductPortionOptions(product);
                    return (
                      <button
                        className={order.product === product.name ? 'selected' : ''}
                        key={product.id}
                        onClick={() => {
                          const productFillings = fillings.filter((filling) => product.filling_ids.includes(filling.id));
                          const selectedFillings = productFillings.slice(0, 1).map((filling) => filling.name);
                          const selectedDoughs = order.doughs.length ? order.doughs : doughs[0]?.name ? [doughs[0].name] : [];
                          setOrder((current) => ({
                            ...current,
                            product: product.name,
                            portions: options[0]?.label ?? product.portions,
                            selected_price: options[0]?.price ?? getBaseProductPrice(product),
                            fillings: selectedFillings,
                            filling: selectedFillings.join(', '),
                            doughs: selectedDoughs,
                            dough: selectedDoughs.join(', '),
                          }));
                        }}
                        type="button"
                      >
                        <img src={product.image_url || logo} alt="" />
                        <strong>{product.name}</strong>
                        <span>Desde Bs. {getBaseProductPrice(product)} - {options.map((option) => option.label).join(', ')}</span>
                      </button>
                    );
                  })
                ) : (
                  <p className="empty-state full-row">Aun no hay productos cargados desde admin.</p>
                )}
              </div>
            </div>
          )}

          {orderStep === 1 && (
            <div className="step-panel full-row">
              <div className="step-title">
                <p className="eyebrow">Paso 2</p>
                <h3>Personaliza sabor y detalles</h3>
              </div>
              <div className="step-fields">
                <label>
                  Porciones
                  <select
                    value={order.portions}
                    onChange={(e) => {
                      const option = selectedProduct ? getProductPortionOptions(selectedProduct).find((item) => item.label === e.target.value) : null;
                      setOrder((current) => ({
                        ...current,
                        portions: e.target.value,
                        selected_price: option?.price ?? current.selected_price,
                      }));
                    }}
                  >
                    <option value="">Seleccionar porciones</option>
                    {selectedProduct && getProductPortionOptions(selectedProduct).map((option) => (
                      <option key={option.label} value={option.label}>{option.label} - Bs. {option.price}</option>
                    ))}
                  </select>
                </label>
                <div className="price-preview">
                  <span>Precio referencial</span>
                  <strong>Bs. {order.selected_price ?? (selectedProduct ? getBaseProductPrice(selectedProduct) : 0)}</strong>
                </div>
                <div className="full-row checkbox-field">
                  <span>Sabores de masa (elige hasta 3)</span>
                  <div className="check-grid flavor-check-grid">
                    {doughs.map((dough) => {
                      const checked = order.doughs.includes(dough.name);
                      const disabled = !checked && order.doughs.length >= 3;
                      return (
                        <label key={dough.id}>
                          <input
                            checked={checked}
                            disabled={disabled}
                            type="checkbox"
                            onChange={() => toggleOrderDough(dough.name)}
                          />
                          <span className="color-dot" style={{ background: dough.color }} />
                          {dough.name}
                        </label>
                      );
                    })}
                  </div>
                  <small>{order.doughs.length}/3 masas seleccionadas</small>
                </div>
                <div className="full-row checkbox-field">
                  <span>Rellenos incluidos (elige hasta 2)</span>
                  <div className="check-grid flavor-check-grid">
                    {availableFillings.map((filling) => {
                      const checked = order.fillings.includes(filling.name);
                      const disabled = !checked && order.fillings.length >= 2;
                      return (
                        <label key={filling.id}>
                          <input
                            checked={checked}
                            disabled={disabled}
                            type="checkbox"
                            onChange={() => toggleOrderFilling(filling.name)}
                          />
                          <span className="color-dot" style={{ background: filling.color }} />
                          {filling.name}
                        </label>
                      );
                    })}
                  </div>
                  <small>{order.fillings.length}/2 rellenos seleccionados</small>
                </div>
                <label className="full-row">
                  Decoracion, dedicatoria, toppers o alergias
                  <textarea
                    value={order.message}
                    onChange={(e) => updateOrder('message', e.target.value)}
                    onInput={(e) => updateOrder('message', e.currentTarget.value)}
                    placeholder="Ej. decoracion vintage, topper de cumpleanos, frase corta, sin nueces."
                  />
                </label>
              </div>
            </div>
          )}

          {orderStep === 2 && (
            <div className="step-panel full-row">
              <div className="step-title">
                <p className="eyebrow">Paso 3</p>
                <h3>Datos para coordinar la entrega</h3>
              </div>
              <div className="step-fields">
                <label>
                  Nombre completo
                  <input
                    required
                    value={order.full_name}
                    onChange={(e) => updateOrder('full_name', e.target.value)}
                    onInput={(e) => updateOrder('full_name', e.currentTarget.value)}
                  />
                </label>
                <label>
                  WhatsApp
                  <input
                    required
                    value={order.phone}
                    onChange={(e) => updateOrder('phone', e.target.value)}
                    onInput={(e) => updateOrder('phone', e.currentTarget.value)}
                  />
                </label>
                <label>
                  Modalidad
                  <select value={order.delivery_mode} onChange={(e) => updateOrder('delivery_mode', e.target.value)}>
                    <option>Delivery</option>
                    <option>Recojo en futuro local</option>
                    <option>Por coordinar</option>
                  </select>
                </label>
                <label>
                  Fecha
                  <input
                    type="date"
                    value={order.delivery_date}
                    onChange={(e) => updateOrder('delivery_date', e.target.value)}
                    onInput={(e) => updateOrder('delivery_date', e.currentTarget.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {orderStep === 3 && (
            <div className="step-panel confirmation-panel full-row">
              <div className="step-title">
                <p className="eyebrow">Paso 4</p>
                <h3>Confirma tu solicitud de reserva</h3>
              </div>
              <dl className="reservation-summary">
                <div><dt>Producto</dt><dd>{order.product || 'Sin seleccionar'}</dd></div>
                <div><dt>Masas</dt><dd>{order.doughs.join(', ') || 'Sin seleccionar'}</dd></div>
                <div><dt>Rellenos</dt><dd>{order.fillings.join(', ') || 'Sin seleccionar'}</dd></div>
                <div><dt>Porciones</dt><dd>{order.portions || 'Sin definir'}</dd></div>
                <div><dt>Precio referencial</dt><dd>Bs. {order.selected_price ?? (selectedProduct ? getBaseProductPrice(selectedProduct) : 0)}</dd></div>
                <div><dt>Fecha</dt><dd>{order.delivery_date || 'Por confirmar'}</dd></div>
                <div><dt>Modalidad</dt><dd>{order.delivery_mode}</dd></div>
                <div><dt>Cliente</dt><dd>{order.full_name || 'Sin nombre'} - {order.phone || 'Sin WhatsApp'}</dd></div>
                <div className="full-row"><dt>Detalles</dt><dd>{order.message || 'Sin detalle adicional'}</dd></div>
              </dl>
              <p className="order-note">
                Al presionar el boton final, estos mismos datos se registran y se envian a WhatsApp.
              </p>
            </div>
          )}

          <div className="stepper-actions full-row">
            <button className="secondary-button" disabled={orderStep === 0} onClick={previousOrderStep} type="button">
              Atrás
            </button>
            {orderStep < orderSteps.length - 1 ? (
              <button className="primary-button" disabled={!canGoNext()} onClick={nextOrderStep} type="button">
                Siguiente
              </button>
            ) : (
              <button className="primary-button" type="submit" disabled={orderStatus === 'loading' || !footer.whatsapp}>
                <Send size={18} /> {orderStatus === 'loading' ? 'Enviando...' : 'Registrar y enviar por WhatsApp'}
              </button>
            )}
          </div>
          {!footer.whatsapp && (
            <p className="form-status error">Configura el WhatsApp del negocio desde el panel admin para recibir pedidos.</p>
          )}
          {!canGoNext() && orderStep < orderSteps.length - 1 && (
            <p className="form-status error">Completa los datos de este paso para continuar.</p>
          )}
          {orderStatus === 'success' && <p className="form-status success">Reserva registrada. WhatsApp se abrio con tus datos reales.</p>}
          {orderStatus === 'error' && <p className="form-status error">No se pudo registrar. Intenta por WhatsApp.</p>}
        </form>
      </section>

      <footer>
        <div>
          <img src={logo} alt="" />
          {footer.brand_text && <p>{footer.brand_text}</p>}
        </div>
        {footer.address && <p>{footer.address}</p>}
        {footer.phone && <p>{footer.phone}</p>}
        {footerLinks.length > 0 && (
          <div className="social-links">
            {footerLinks.map((link) => (
              <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
                {link.icon} {link.label}
              </a>
            ))}
          </div>
        )}
        {footer.copyright && <small>{footer.copyright}</small>}
      </footer>
    </main>
  );
}

function AdminPanel({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <p className="eyebrow">Administracion</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function CrudList({ children }: { children: React.ReactNode }) {
  return <div className="crud-list">{children}</div>;
}

export default App;
