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
import type { CarouselSlide, Filling, FooterConfig, OrderPayload, Product } from './types';

type DataStatus = 'idle' | 'loading' | 'success' | 'error';
type AdminTab = 'catalogo' | 'rellenos' | 'carrusel' | 'footer' | 'pedidos';

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
const productHref = (id: string) => `${catalogHref}#producto-${id}`;

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

const defaultProducts: Product[] = [
  {
    id: 'torta-vintage',
    name: 'Torta clasica vintage',
    category: 'Tortas personalizadas',
    description: 'Torta tradicional desde 20 porciones con decoracion vintage, dedicatoria y toppers.',
    price: 180,
    portions: '20 porciones',
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

const initialOrder: OrderPayload = {
  full_name: '',
  phone: '',
  product: '',
  filling: '',
  portions: '',
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
  if (slide.target_type === 'WhatsApp') return `https://wa.me/${footer.whatsapp || WHATSAPP_NUMBER}`;
  return slide.target_value || '#inicio';
};

function App() {
  const normalizedPathname = window.location.pathname.replace(/\/$/, '') || '/';
  const isAdminRoute = normalizedPathname === adminPath;
  const isCatalogRoute = normalizedPathname === catalogPath;
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [fillings, setFillings] = useState<Filling[]>(defaultFillings);
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter);
  const [order, setOrder] = useState<OrderPayload>(initialOrder);
  const [orderStatus, setOrderStatus] = useState<DataStatus>('idle');
  const [orderStep, setOrderStep] = useState(0);
  const [savedOrders, setSavedOrders] = useState<OrderPayload[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [fillingFilter, setFillingFilter] = useState('Todos');
  const [maxPriceFilter, setMaxPriceFilter] = useState('Todos');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [loginStatus, setLoginStatus] = useState<DataStatus>('idle');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('catalogo');
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [fillingForm, setFillingForm] = useState<Filling>(emptyFilling);
  const [slideForm, setSlideForm] = useState<CarouselSlide>(emptySlide);

  const activeSlides = slides.filter((slide) => slide.is_active);
  const firstSlide = activeSlides[0] ?? defaultSlides[0];
  const selectedProduct = products.find((product) => product.name === order.product);
  const availableFillings = selectedProduct
    ? fillings.filter((filling) => selectedProduct.filling_ids.includes(filling.id))
    : fillings;
  const orderSteps = ['Producto', 'Personalizacion', 'Entrega', 'Confirmacion'];
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
      const matchesPrice = product.price <= maxPrice;
      return matchesSearch && matchesCategory && matchesFilling && matchesPrice;
    });
  }, [catalogSearch, categoryFilter, fillingFilter, fillings, maxPriceFilter, products]);

  const buildOrderForProduct = (product: Product) => {
    const productFillings = fillings.filter((filling) => product.filling_ids.includes(filling.id));
    return {
      ...order,
      product: product.name,
      portions: product.portions,
      filling: productFillings[0]?.name ?? fillings[0]?.name ?? '',
    };
  };

  const storePendingProductOrder = (product: Product) => {
    saveLocal('dulce-miga-pending-order', buildOrderForProduct(product));
  };

  const buildWhatsappUrl = (payload: OrderPayload) => {
    const product = products.find((item) => item.name === payload.product);
    const lines = [
      'Hola Dulce Miga, quiero realizar una reserva con estos datos:',
      `Cliente: ${payload.full_name || 'Sin nombre'}`,
      `WhatsApp del cliente: ${payload.phone || 'Sin WhatsApp'}`,
      `Producto: ${payload.product || 'Sin seleccionar'}`,
      `Precio referencial: ${product ? `Bs. ${product.price}` : 'Por confirmar'}`,
      `Relleno: ${payload.filling || 'Sin seleccionar'}`,
      `Porciones: ${payload.portions || 'Sin definir'}`,
      `Modalidad: ${payload.delivery_mode || 'Por coordinar'}`,
      `Fecha requerida: ${payload.delivery_date || 'Por confirmar'}`,
      `Detalles: ${payload.message || 'Sin detalle adicional'}`,
    ];

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        setProducts(readLocal('dulce-miga-products', defaultProducts));
        setFillings(readLocal('dulce-miga-fillings', defaultFillings));
        setSlides(readLocal('dulce-miga-slides', defaultSlides));
        setFooter(readLocal('dulce-miga-footer', defaultFooter));
        setSavedOrders(readLocal('dulce-miga-orders', []));
        return;
      }

      const [productResult, fillingResult, slideResult, footerResult] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: true }),
        supabase.from('fillings').select('*').order('created_at', { ascending: true }),
        supabase.from('carousel_slides').select('*').order('created_at', { ascending: true }),
        supabase.from('footer_config').select('*').limit(1).maybeSingle(),
      ]);

      if (!productResult.error && productResult.data?.length) setProducts(productResult.data as Product[]);
      if (!fillingResult.error && fillingResult.data?.length) setFillings(fillingResult.data as Filling[]);
      if (!slideResult.error && slideResult.data?.length) setSlides(slideResult.data as CarouselSlide[]);
      if (!footerResult.error && footerResult.data) setFooter(footerResult.data as FooterConfig);
      setSavedOrders(readLocal('dulce-miga-orders', []));
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
      if (!error && data) setSavedOrders(data as OrderPayload[]);
    };

    loadSavedOrders().catch((error) => console.error(error));
  }, [adminAuthed]);

  useEffect(() => {
    if (!order.product && products[0]) {
      setOrder((current) => ({
        ...current,
        product: products[0].name,
        portions: products[0].portions,
        filling: fillings[0]?.name ?? '',
      }));
    }
  }, [fillings, order.product, products]);

  const isOrderReady = () =>
    Boolean(order.product && order.filling && order.portions && order.full_name && order.phone && order.delivery_date);

  const updateOrder = (field: keyof OrderPayload, value: string) => {
    setOrder((current) => ({ ...current, [field]: value }));
  };

  const canGoNext = () => {
    if (orderStep === 0) return Boolean(order.product);
    if (orderStep === 1) return Boolean(order.filling && order.portions);
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

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const product = { ...productForm, id: productForm.id || slug(productForm.name), image_url: productForm.image_url || logo };
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
      setProductForm(emptyProduct);
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
      setFillingForm(emptyFilling);
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

  const saveSlide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slide = { ...slideForm, id: slideForm.id || slug(slideForm.title), image_url: slideForm.image_url || logo };
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
      setSlideForm(emptySlide);
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

    const payload = { ...order };
    const whatsappWindow = window.open('', '_blank', 'noopener,noreferrer');
    setOrderStatus('loading');

    try {
      let savedInSupabase = false;
      if (supabase) {
        const { error } = await supabase.from('orders').insert(payload);
        if (!error) savedInSupabase = true;
        if (error) console.error(error);
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
      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error(error);
      if (whatsappWindow) whatsappWindow.close();
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
              <p>Gestiona catalogo, carrusel, rellenos y footer de Dulce Miga.</p>
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
              <small>Supabase: {isSupabaseConfigured ? 'configurado' : 'modo demo local'}</small>
            </form>
          </section>
        ) : (
          <section className="admin-shell">
            <aside className="admin-sidebar">
              {[
                ['catalogo', 'Catalogo de tortas'],
                ['rellenos', 'Rellenos'],
                ['carrusel', 'Carrusel'],
                ['footer', 'Footer y redes'],
                ['pedidos', 'Pedidos'],
              ].map(([key, label]) => (
                <button
                  className={activeTab === key ? 'active' : ''}
                  key={key}
                  onClick={() => setActiveTab(key as AdminTab)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </aside>

            <div className="admin-content">
              {activeTab === 'catalogo' && (
                <AdminPanel title="Catalogo de tortas y postres" description="CRUD de productos visibles en la pagina publica.">
                  <form className="admin-form" onSubmit={saveProduct}>
                    <label>
                      Nombre
                      <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                    </label>
                    <label>
                      Categoria
                      <input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                    </label>
                    <label>
                      Precio Bs.
                      <input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                    </label>
                    <label>
                      Porciones
                      <input value={productForm.portions} onChange={(e) => setProductForm({ ...productForm, portions: e.target.value })} />
                    </label>
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
                    <button className="primary-button" type="submit"><Save size={17} /> Guardar producto</button>
                  </form>

                  <CrudList>
                    {products.map((product) => (
                      <article key={product.id}>
                        <img src={product.image_url || logo} alt="" />
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.category} - Bs. {product.price}</span>
                        </div>
                        <button type="button" onClick={() => setProductForm(product)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteProduct(product.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                </AdminPanel>
              )}

              {activeTab === 'rellenos' && (
                <AdminPanel title="Rellenos" description="Administra sabores y descripciones incluidos en el precio de cada torta.">
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
                    <button className="primary-button" type="submit"><Save size={17} /> Guardar relleno</button>
                  </form>
                  <CrudList>
                    {fillings.map((filling) => (
                      <article key={filling.id}>
                        <span className="color-dot" style={{ background: filling.color }} />
                        <div>
                          <strong>{filling.name}</strong>
                          <span>Incluido en el precio de la torta</span>
                        </div>
                        <button type="button" onClick={() => setFillingForm(filling)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteFilling(filling.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                </AdminPanel>
              )}

              {activeTab === 'carrusel' && (
                <AdminPanel title="Carrusel principal" description="Sube imagenes y define a donde dirige cada slide.">
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
                    <button className="primary-button" type="submit"><Upload size={17} /> Guardar slide</button>
                  </form>
                  <CrudList>
                    {slides.map((slide) => (
                      <article key={slide.id}>
                        <img src={slide.image_url || logo} alt="" />
                        <div>
                          <strong>{slide.title}</strong>
                          <span>{slide.target_type}: {slide.target_value || 'sin destino'}</span>
                        </div>
                        <button type="button" onClick={() => setSlideForm(slide)}><Edit3 size={16} /></button>
                        <button type="button" onClick={() => deleteSlide(slide.id)}><Trash2 size={16} /></button>
                      </article>
                    ))}
                  </CrudList>
                </AdminPanel>
              )}

              {activeTab === 'footer' && (
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

              {activeTab === 'pedidos' && (
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
                              Relleno: {item.filling || 'sin definir'} | Porciones: {item.portions || 'sin definir'}
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
            <a href={`${baseUrl}#rellenos`}>Rellenos</a>
            <a href={`${baseUrl}#pedido`}>Realizar pedido</a>
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
              filteredProducts.map((product) => (
                <article className="product-card catalog-card" id={`producto-${product.id}`} key={product.id}>
                  <img src={product.image_url || logo} alt={product.name} />
                  <div className="product-meta">
                    <span>{product.category}</span>
                    {product.is_featured && <small>Destacado</small>}
                  </div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-bottom">
                    <strong>Bs. {product.price}</strong>
                    <span>{product.portions}</span>
                  </div>
                  <div className="chips">
                    {fillings
                      .filter((filling) => product.filling_ids.includes(filling.id))
                      .map((filling) => <span key={filling.id}>{filling.name}</span>)}
                  </div>
                  <a
                    className="primary-button product-reserve-link"
                    href={`${baseUrl}#pedido`}
                    onClick={() => storePendingProductOrder(product)}
                  >
                    <Send size={17} /> Reservar este producto
                  </a>
                </article>
              ))
            ) : (
              <p className="empty-state full-row">No hay productos que coincidan con los filtros seleccionados.</p>
            )}
          </div>
        </section>

        <footer>
          <div>
            <img src={logo} alt="" />
            <p>{footer.brand_text}</p>
          </div>
          <p>{footer.address}</p>
          <p>{footer.phone || WHATSAPP_DISPLAY}</p>
          <div className="social-links">
            <a href={footer.facebook} target="_blank" rel="noreferrer"><Facebook size={17} /> Facebook</a>
            <a href={footer.instagram} target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram</a>
            <a href={footer.tiktok} target="_blank" rel="noreferrer"><Sparkles size={17} /> TikTok</a>
            <a href={`https://wa.me/${footer.whatsapp || WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>
          </div>
          <small>{footer.copyright}</small>
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
          <a href={catalogHref}>Catalogo</a>
          <a href="#rellenos">Rellenos</a>
          <a href="#pedido">Pedido</a>
        </nav>
      </header>

      <section className="hero bakery-hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Pasteleria artesanal por pedido</p>
          <h1>Dulces momentos hechos a tu medida</h1>
          <p>
            Tortas clasicas, decoracion vintage, toppers personalizados y rellenos de maracuya,
            menta o chocolate para celebraciones con sabor familiar.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#pedido"><Send size={18} /> Cotizar por WhatsApp</a>
            <a className="secondary-button" href={catalogHref}>Ver catalogo</a>
          </div>
        </div>
        <article className="carousel-card">
          <img src={firstSlide.image_url || logo} alt={firstSlide.title} />
          <div>
            <span>Carrusel Dulce Miga</span>
            <h2>{firstSlide.title}</h2>
            <p>{firstSlide.subtitle}</p>
            <a className="secondary-button" href={getTargetHref(firstSlide, footer)}>Ver detalle</a>
          </div>
        </article>
      </section>

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

      <section className="flavor-band" id="rellenos">
        <div>
          <p className="eyebrow">Rellenos</p>
          <h2>Sabores que hacen memorable cada torta</h2>
        </div>
        <div className="flavor-list">
          {fillings.map((filling) => (
            <span key={filling.id} style={{ background: filling.color }}>
              {filling.name}
            </span>
          ))}
        </div>
      </section>

      <section className="section service-public" id="servicio">
        <div className="section-heading">
          <p className="eyebrow">Como funciona</p>
          <h2>Del mensaje a la entrega</h2>
        </div>
        <div className="flow-grid">
          {['Contactas por redes', 'Recibes asesoria', 'Confirmas el pago', 'Preparamos tu pedido', 'Coordinamos entrega', 'Seguimiento postventa'].map((step, index) => (
            <article className="flow-step" key={step}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <Check size={20} />
              <h3>{step}</h3>
              <p>Proceso claro para reducir errores y cuidar la experiencia de compra.</p>
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
            con el resumen exacto del producto, relleno, fecha y detalles que escribiste.
          </p>
          <ol className="order-process-list">
            <li>Selecciona el producto del catalogo.</li>
            <li>Define relleno, porciones, decoracion y toppers.</li>
            <li>Registra nombre, WhatsApp, fecha y modalidad.</li>
            <li>Confirma y envia el pedido al WhatsApp de Dulce Miga.</li>
          </ol>
          <p className="whatsapp-contact">WhatsApp de pedidos: {footer.phone || WHATSAPP_DISPLAY}</p>
          <div className="supabase-note">Supabase: {isSupabaseConfigured ? 'conectado' : 'modo demo local'}</div>
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
                {products.map((product) => (
                  <button
                    className={order.product === product.name ? 'selected' : ''}
                    key={product.id}
                    onClick={() => {
                      const productFillings = fillings.filter((filling) => product.filling_ids.includes(filling.id));
                      setOrder((current) => ({
                        ...current,
                        product: product.name,
                        portions: product.portions,
                        filling: productFillings[0]?.name ?? fillings[0]?.name ?? '',
                      }));
                    }}
                    type="button"
                  >
                    <img src={product.image_url || logo} alt="" />
                    <strong>{product.name}</strong>
                    <span>Bs. {product.price} - {product.portions}</span>
                  </button>
                ))}
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
                  Relleno
                  <select value={order.filling} onChange={(e) => updateOrder('filling', e.target.value)}>
                    {availableFillings.map((filling) => <option key={filling.id}>{filling.name}</option>)}
                  </select>
                </label>
                <label>
                  Porciones
                  <input
                    value={order.portions}
                    onChange={(e) => updateOrder('portions', e.target.value)}
                    onInput={(e) => updateOrder('portions', e.currentTarget.value)}
                  />
                </label>
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
                <div><dt>Relleno</dt><dd>{order.filling || 'Sin seleccionar'}</dd></div>
                <div><dt>Porciones</dt><dd>{order.portions || 'Sin definir'}</dd></div>
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
              <button className="primary-button" type="submit" disabled={orderStatus === 'loading'}>
                <Send size={18} /> {orderStatus === 'loading' ? 'Enviando...' : 'Registrar y enviar por WhatsApp'}
              </button>
            )}
          </div>
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
          <p>{footer.brand_text}</p>
        </div>
        <p>{footer.address}</p>
        <p>{footer.phone || WHATSAPP_DISPLAY}</p>
        <div className="social-links">
          <a href={footer.facebook} target="_blank" rel="noreferrer"><Facebook size={17} /> Facebook</a>
          <a href={footer.instagram} target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram</a>
          <a href={footer.tiktok} target="_blank" rel="noreferrer"><Sparkles size={17} /> TikTok</a>
          <a href={`https://wa.me/${footer.whatsapp || WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>
        </div>
        <small>{footer.copyright}</small>
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
