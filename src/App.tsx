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
type AdminTab = 'catalogo' | 'rellenos' | 'carrusel' | 'footer';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '12345678';
const STORAGE_BUCKET = 'dulce-miga';

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
    extra_price: 5,
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
  phone: '+591 70000000',
  whatsapp: '59170000000',
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
  target_value: '#catalogo',
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

const getTargetHref = (slide: CarouselSlide, footer: FooterConfig) => {
  if (slide.target_type === 'Producto') return `#producto-${slide.target_value}`;
  if (slide.target_type === 'Catalogo') return '#catalogo';
  if (slide.target_type === 'WhatsApp') return `https://wa.me/${footer.whatsapp}`;
  return slide.target_value || '#inicio';
};

function App() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [fillings, setFillings] = useState<Filling[]>(defaultFillings);
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [footer, setFooter] = useState<FooterConfig>(defaultFooter);
  const [order, setOrder] = useState<OrderPayload>(initialOrder);
  const [orderStatus, setOrderStatus] = useState<DataStatus>('idle');
  const [adminAuthed, setAdminAuthed] = useState(() => localStorage.getItem('dulce-miga-admin') === 'true');
  const [loginStatus, setLoginStatus] = useState<DataStatus>('idle');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('catalogo');
  const [productForm, setProductForm] = useState<Product>(emptyProduct);
  const [fillingForm, setFillingForm] = useState<Filling>(emptyFilling);
  const [slideForm, setSlideForm] = useState<CarouselSlide>(emptySlide);

  const activeSlides = slides.filter((slide) => slide.is_active);
  const firstSlide = activeSlides[0] ?? defaultSlides[0];

  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        setProducts(readLocal('dulce-miga-products', defaultProducts));
        setFillings(readLocal('dulce-miga-fillings', defaultFillings));
        setSlides(readLocal('dulce-miga-slides', defaultSlides));
        setFooter(readLocal('dulce-miga-footer', defaultFooter));
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
    };

    loadData().catch((error) => console.error(error));
  }, []);

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

  const whatsappText = useMemo(() => {
    const text = `Hola Dulce Miga, quiero cotizar:%0AProducto: ${order.product}%0ARelleno: ${order.filling}%0APorciones: ${order.portions}%0AFecha: ${order.delivery_date || 'por confirmar'}%0ADetalle: ${order.message || 'sin detalle adicional'}`;
    return `https://wa.me/${footer.whatsapp}?text=${text}`;
  }, [footer.whatsapp, order]);

  const uploadImage = async (file: File, folder: string) => {
    if (!supabase || !(await hasSupabaseSession())) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

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

      localStorage.setItem('dulce-miga-admin', 'true');
      setAdminAuthed(true);
      setLoginStatus('success');
    } catch (error) {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('dulce-miga-admin', 'true');
        setAdminAuthed(true);
        setLoginStatus('success');
        return;
      }
      setLoginError(error instanceof Error ? error.message : 'No se pudo iniciar sesion');
      setLoginStatus('error');
    }
  };

  const logoutAdmin = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('dulce-miga-admin');
    setAdminAuthed(false);
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const product = { ...productForm, id: productForm.id || slug(productForm.name), image_url: productForm.image_url || logo };
    const next = products.some((item) => item.id === product.id)
      ? products.map((item) => (item.id === product.id ? product : item))
      : [...products, product];
    setProducts(next);
    saveLocal('dulce-miga-products', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('products').upsert(product);
    setProductForm(emptyProduct);
  };

  const deleteProduct = async (id: string) => {
    const next = products.filter((item) => item.id !== id);
    setProducts(next);
    saveLocal('dulce-miga-products', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('products').delete().eq('id', id);
  };

  const saveFilling = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filling = { ...fillingForm, id: fillingForm.id || slug(fillingForm.name) };
    const next = fillings.some((item) => item.id === filling.id)
      ? fillings.map((item) => (item.id === filling.id ? filling : item))
      : [...fillings, filling];
    setFillings(next);
    saveLocal('dulce-miga-fillings', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('fillings').upsert(filling);
    setFillingForm(emptyFilling);
  };

  const deleteFilling = async (id: string) => {
    const next = fillings.filter((item) => item.id !== id);
    setFillings(next);
    saveLocal('dulce-miga-fillings', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('fillings').delete().eq('id', id);
  };

  const saveSlide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slide = { ...slideForm, id: slideForm.id || slug(slideForm.title), image_url: slideForm.image_url || logo };
    const next = slides.some((item) => item.id === slide.id)
      ? slides.map((item) => (item.id === slide.id ? slide : item))
      : [...slides, slide];
    setSlides(next);
    saveLocal('dulce-miga-slides', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('carousel_slides').upsert(slide);
    setSlideForm(emptySlide);
  };

  const deleteSlide = async (id: string) => {
    const next = slides.filter((item) => item.id !== id);
    setSlides(next);
    saveLocal('dulce-miga-slides', next);
    if (supabase && (await hasSupabaseSession())) await supabase.from('carousel_slides').delete().eq('id', id);
  };

  const saveFooter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveLocal('dulce-miga-footer', footer);
    if (supabase && (await hasSupabaseSession())) await supabase.from('footer_config').upsert({ id: 'main', ...footer });
    alert('Footer actualizado');
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOrderStatus('loading');
    try {
      if (supabase) {
        const { error } = await supabase.from('orders').insert(order);
        if (error) throw error;
      } else {
        const savedOrders = readLocal<OrderPayload[]>('dulce-miga-orders', []);
        saveLocal('dulce-miga-orders', [...savedOrders, order]);
      }
      setOrderStatus('success');
      setOrder(initialOrder);
    } catch (error) {
      console.error(error);
      setOrderStatus('error');
    }
  };

  if (location.hash === '#admin') {
    return (
      <main className="admin-page">
        <header className="site-header">
          <a className="brand" href="#inicio">
            <img src={logo} alt="Logo Dulce Miga" />
            <span>Dulce Miga Admin</span>
          </a>
          <nav>
            <a href="#inicio">Vista publica</a>
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
                <AdminPanel title="Rellenos" description="Administra sabores, descripciones y recargos.">
                  <form className="admin-form" onSubmit={saveFilling}>
                    <label>
                      Nombre
                      <input value={fillingForm.name} onChange={(e) => setFillingForm({ ...fillingForm, name: e.target.value })} required />
                    </label>
                    <label>
                      Recargo Bs.
                      <input type="number" value={fillingForm.extra_price} onChange={(e) => setFillingForm({ ...fillingForm, extra_price: Number(e.target.value) })} />
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
                          <span>Recargo: Bs. {filling.extra_price}</span>
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
                          placeholder={slideForm.target_type === 'WhatsApp' ? footer.whatsapp : '#catalogo o https://...'}
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
            </div>
          </section>
        )}
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
          <a href="#catalogo">Catalogo</a>
          <a href="#rellenos">Rellenos</a>
          <a href="#pedido">Pedido</a>
          <a href="#admin">Admin</a>
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
            <a className="secondary-button" href="#catalogo">Ver catalogo</a>
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

      <section className="section" id="catalogo">
        <div className="section-heading">
          <p className="eyebrow">Catalogo</p>
          <h2>Tortas y postres disponibles</h2>
          <p>Estos productos se administran desde el panel y se muestran automaticamente al publico.</p>
        </div>
        <div className="product-grid catalog-grid">
          {products.map((product) => (
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
            </article>
          ))}
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
          <p>Selecciona producto, relleno y fecha. Dulce Miga confirma detalles por WhatsApp.</p>
          <div className="supabase-note">Supabase: {isSupabaseConfigured ? 'conectado' : 'modo demo local'}</div>
        </div>

        <form className="order-form" onSubmit={submitOrder}>
          <label>
            Nombre completo
            <input required value={order.full_name} onChange={(e) => setOrder({ ...order, full_name: e.target.value })} />
          </label>
          <label>
            WhatsApp
            <input required value={order.phone} onChange={(e) => setOrder({ ...order, phone: e.target.value })} />
          </label>
          <label>
            Producto
            <select
              value={order.product}
              onChange={(e) => {
                const selected = products.find((product) => product.name === e.target.value);
                setOrder({ ...order, product: e.target.value, portions: selected?.portions ?? order.portions });
              }}
            >
              {products.map((product) => <option key={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label>
            Relleno
            <select value={order.filling} onChange={(e) => setOrder({ ...order, filling: e.target.value })}>
              {fillings.map((filling) => <option key={filling.id}>{filling.name}</option>)}
            </select>
          </label>
          <label>
            Porciones
            <input value={order.portions} onChange={(e) => setOrder({ ...order, portions: e.target.value })} />
          </label>
          <label>
            Modalidad
            <select value={order.delivery_mode} onChange={(e) => setOrder({ ...order, delivery_mode: e.target.value })}>
              <option>Delivery</option>
              <option>Recojo en futuro local</option>
              <option>Por coordinar</option>
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={order.delivery_date} onChange={(e) => setOrder({ ...order, delivery_date: e.target.value })} />
          </label>
          <label className="full-row">
            Decoracion, dedicatoria o alergias
            <textarea value={order.message} onChange={(e) => setOrder({ ...order, message: e.target.value })} />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={orderStatus === 'loading'}>
              <Send size={18} /> {orderStatus === 'loading' ? 'Enviando...' : 'Registrar pedido'}
            </button>
            <a className="whatsapp-button" href={whatsappText} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
          {orderStatus === 'success' && <p className="form-status success">Pedido registrado correctamente.</p>}
          {orderStatus === 'error' && <p className="form-status error">No se pudo registrar. Intenta por WhatsApp.</p>}
        </form>
      </section>

      <footer>
        <div>
          <img src={logo} alt="" />
          <p>{footer.brand_text}</p>
        </div>
        <p>{footer.address}</p>
        <div className="social-links">
          <a href={footer.facebook} target="_blank" rel="noreferrer"><Facebook size={17} /> Facebook</a>
          <a href={footer.instagram} target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram</a>
          <a href={footer.tiktok} target="_blank" rel="noreferrer"><Sparkles size={17} /> TikTok</a>
          <a href={`https://wa.me/${footer.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> WhatsApp</a>
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
