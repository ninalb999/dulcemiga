# Dulce Miga Web

Sitio web responsive para Dulce Miga, una microempresa de pasteleria artesanal. Incluye vista publica de pasteleria, catalogo dinamico, rellenos, carrusel, formulario de pedidos y panel administrativo.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el SQL de `supabase/schema.sql` en el SQL Editor.
3. Crea en Supabase Auth el usuario administrador:

```text
admin@gmail.com
12345678
```

4. Copia `.env.example` como `.env` y agrega:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

El sitio lee publicamente `products`, `fillings`, `carousel_slides` y `footer_config`. El admin autenticado puede hacer CRUD y subir imagenes al bucket publico `dulce-miga`.

## Panel administrativo

Ruta local o publica:

```text
#admin
```

Modulos disponibles:

- Catalogo de tortas y postres: nombre, categoria, precio, porciones, imagen, rellenos y destacado.
- Rellenos: nombre, descripcion, recargo y color.
- Carrusel: imagen, texto y direccionamiento por combobox hacia producto, catalogo, WhatsApp o URL personalizada.
- Footer: texto de marca, direccion, telefono, WhatsApp y redes sociales.

Si Supabase no esta configurado, el panel funciona en modo demo con `localStorage`.

## Despliegue en GitHub Pages

El workflow `.github/workflows/pages.yml` compila la app y la publica en GitHub Pages. Para activar Supabase en produccion, agrega los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el repositorio.
