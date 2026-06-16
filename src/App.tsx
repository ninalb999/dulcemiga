import { FormEvent, useMemo, useState } from 'react';
import {
  CakeSlice,
  CheckCircle2,
  Clock3,
  Heart,
  Instagram,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import logo from './assets/logo-dulce-miga.jpg';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { OrderPayload } from './types';

type IconComponent = typeof CakeSlice;

type FlowStep = {
  title: string;
  description: string;
  icon: IconComponent;
};

const products = [
  {
    title: 'Tortas clasicas personalizadas',
    description: 'Tortas tradicionales desde 20 porciones, con decoracion vintage, dedicatorias y toppers.',
    tag: 'Producto principal',
    icon: CakeSlice,
  },
  {
    title: 'Minitortas',
    description: 'Formato de 6 a 10 porciones para celebraciones pequenas, regalos o reuniones familiares.',
    tag: 'Nueva linea',
    icon: Sparkles,
  },
  {
    title: 'Postres individuales',
    description: 'Porciones listas para consumir, ideales para antojos, meriendas y detalles personalizados.',
    tag: 'Expansion de catalogo',
    icon: Heart,
  },
];

const fillings = ['Maracuya', 'Menta', 'Chocolate', 'Clasico vainilla', 'Dulce de leche'];

const flow: FlowStep[] = [
  {
    title: 'Atraccion',
    description: 'Instagram, Facebook, TikTok o WhatsApp conectan con nuevos clientes.',
    icon: MessageCircle,
  },
  {
    title: 'Asesoria',
    description: 'Catalogo digital, precios claros y registro de detalles del pedido.',
    icon: Phone,
  },
  {
    title: 'Confirmacion',
    description: 'Pago verificado y mensaje oficial con fecha, hora y producto.',
    icon: CheckCircle2,
  },
  {
    title: 'Produccion',
    description: 'Recetas estandarizadas, decoracion vintage y acabado segun referencia.',
    icon: CakeSlice,
  },
  {
    title: 'Entrega',
    description: 'Delivery cuidadoso o recojo futuro en local con revision del producto.',
    icon: Truck,
  },
  {
    title: 'Postventa',
    description: 'Seguimiento, resenas, incentivo de recompra y gestion de quejas.',
    icon: PackageCheck,
  },
];

const servqual = [
  ['Fiabilidad', 'Cumplir el pedido prometido en sabor, diseno, tamano y horario.'],
  ['Capacidad de respuesta', 'Responder consultas en menos de 15 minutos durante horarios activos.'],
  ['Seguridad', 'Transmitir confianza con higiene, comprobantes y comunicacion clara.'],
  ['Empatia', 'Personalizar cada torta segun ocasion, dedicatoria y preferencias del cliente.'],
  ['Elementos tangibles', 'Cuidar empaque, stickers, fotografias reales y presentacion instagrameable.'],
];

const initialOrder: OrderPayload = {
  full_name: '',
  phone: '',
  product: 'Torta clasica personalizada',
  filling: 'Maracuya',
  portions: '20 porciones',
  delivery_mode: 'Delivery',
  delivery_date: '',
  message: '',
};

function App() {
  const [order, setOrder] = useState<OrderPayload>(initialOrder);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const whatsappText = useMemo(() => {
    const text = `Hola Dulce Miga, quiero cotizar un pedido:%0AProducto: ${order.product}%0ARelleno: ${order.filling}%0APorciones: ${order.portions}%0AFecha: ${order.delivery_date || 'por confirmar'}%0AMensaje: ${order.message || 'sin detalle adicional'}`;
    return `https://wa.me/?text=${text}`;
  }, [order]);

  const updateOrder = (field: keyof OrderPayload, value: string) => {
    setOrder((current) => ({ ...current, [field]: value }));
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');

    try {
      if (supabase) {
        const { error } = await supabase.from('orders').insert(order);
        if (error) throw error;
      } else {
        const savedOrders = JSON.parse(localStorage.getItem('dulce-miga-orders') || '[]');
        localStorage.setItem('dulce-miga-orders', JSON.stringify([...savedOrders, order]));
      }

      setStatus('success');
      setOrder(initialOrder);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Inicio Dulce Miga">
          <img src={logo} alt="Logo Dulce Miga" />
          <span>Dulce Miga</span>
        </a>
        <nav aria-label="Navegacion principal">
          <a href="#catalogo">Catalogo</a>
          <a href="#servicio">Servicio</a>
          <a href="#pedido">Pedido</a>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Tortas tradicionales por pedido</p>
          <h1>Junto a ti en los dulces momentos</h1>
          <p>
            Dulce Miga transforma celebraciones en tortas clasicas personalizadas, rellenos memorables y
            una experiencia de compra clara desde WhatsApp hasta la entrega.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#pedido">
              <Send size={18} />
              Solicitar pedido
            </a>
            <a className="secondary-button" href="#catalogo">
              Ver catalogo
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-label="Identidad visual Dulce Miga">
          <img src={logo} alt="Sello Dulce Miga con torta y utensilios de reposteria" />
        </div>
      </section>

      <section className="trust-strip" aria-label="Promesa de servicio">
        <span><Clock3 size={18} /> Respuesta rapida</span>
        <span><ShieldCheck size={18} /> Pedidos confirmados</span>
        <span><Truck size={18} /> Delivery coordinado</span>
        <span><Store size={18} /> Futuro punto de recojo</span>
      </section>

      <section className="section" id="catalogo">
        <div className="section-heading">
          <p className="eyebrow">Catalogo propuesto</p>
          <h2>Lineas para crecer sin perder lo artesanal</h2>
        </div>
        <div className="product-grid">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <article className="product-card" key={product.title}>
                <div className="card-icon"><Icon size={24} /></div>
                <span>{product.tag}</span>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="flavor-band">
        <div>
          <p className="eyebrow">Rellenos destacados</p>
          <h2>Maracuya, menta y chocolate como ganchos de deseo</h2>
        </div>
        <div className="flavor-list">
          {fillings.slice(0, 3).map((flavor) => (
            <span key={flavor}>{flavor}</span>
          ))}
        </div>
      </section>

      <section className="section" id="servicio">
        <div className="section-heading">
          <p className="eyebrow">Blueprint del servicio</p>
          <h2>Del primer mensaje a la fidelizacion</h2>
        </div>
        <div className="flow-grid">
          {flow.map(({ title, description, icon: Icon }, index) => (
            <article className="flow-step" key={title}>
              <strong>{String(index + 1).padStart(2, '0')}</strong>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="quality-section">
        <div>
          <p className="eyebrow">Modelo SERVQUAL</p>
          <h2>Calidad medible para una microempresa en expansion</h2>
          <p>
            El sitio refuerza las cinco dimensiones del servicio para reducir brechas entre lo que el cliente
            espera y lo que finalmente percibe.
          </p>
        </div>
        <div className="quality-list">
          {servqual.map(([title, text]) => (
            <div key={title}>
              <CheckCircle2 size={18} />
              <p><strong>{title}:</strong> {text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="order-section" id="pedido">
        <div className="order-copy">
          <p className="eyebrow">Formulario de pedido</p>
          <h2>Cotiza una torta personalizada</h2>
          <p>
            Los datos se envian a Supabase si configuras las variables de entorno. Mientras tanto, se guardan
            localmente para demostrar el flujo.
          </p>
          <div className="supabase-note">
            Supabase: {isSupabaseConfigured ? 'conectado' : 'modo demo sin credenciales'}
          </div>
        </div>

        <form className="order-form" onSubmit={submitOrder}>
          <label>
            Nombre completo
            <input
              required
              value={order.full_name}
              onChange={(event) => updateOrder('full_name', event.target.value)}
              placeholder="Ej. Andrea Gutierrez"
            />
          </label>
          <label>
            WhatsApp
            <input
              required
              value={order.phone}
              onChange={(event) => updateOrder('phone', event.target.value)}
              placeholder="Ej. 7XXXXXXX"
            />
          </label>
          <label>
            Producto
            <select value={order.product} onChange={(event) => updateOrder('product', event.target.value)}>
              <option>Torta clasica personalizada</option>
              <option>Minitorta personalizada</option>
              <option>Postre individual</option>
            </select>
          </label>
          <label>
            Relleno
            <select value={order.filling} onChange={(event) => updateOrder('filling', event.target.value)}>
              {fillings.map((filling) => <option key={filling}>{filling}</option>)}
            </select>
          </label>
          <label>
            Porciones
            <input value={order.portions} onChange={(event) => updateOrder('portions', event.target.value)} />
          </label>
          <label>
            Modalidad
            <select
              value={order.delivery_mode}
              onChange={(event) => updateOrder('delivery_mode', event.target.value)}
            >
              <option>Delivery</option>
              <option>Recojo en futuro local</option>
              <option>Por coordinar</option>
            </select>
          </label>
          <label>
            Fecha de entrega
            <input
              type="date"
              value={order.delivery_date}
              onChange={(event) => updateOrder('delivery_date', event.target.value)}
            />
          </label>
          <label className="full-row">
            Detalles de decoracion
            <textarea
              value={order.message}
              onChange={(event) => updateOrder('message', event.target.value)}
              placeholder="Decoracion vintage, toppers, colores, dedicatoria o alergias."
            />
          </label>
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={status === 'loading'}>
              <Send size={18} />
              {status === 'loading' ? 'Enviando...' : 'Enviar solicitud'}
            </button>
            <a className="whatsapp-button" href={whatsappText} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
          {status === 'success' && <p className="form-status success">Solicitud registrada correctamente.</p>}
          {status === 'error' && <p className="form-status error">No se pudo registrar. Revisa Supabase o intenta por WhatsApp.</p>}
        </form>
      </section>

      <footer>
        <div>
          <img src={logo} alt="" />
          <p>Dulce Miga</p>
        </div>
        <p><Instagram size={16} /> Facebook Marketplace, Instagram, TikTok y WhatsApp como canales de expansion.</p>
        <p><MapPin size={16} /> Enfoque inicial: pedidos desde domicilio y entregas coordinadas.</p>
      </footer>
    </main>
  );
}

export default App;
