# Dulce Miga Web

Sitio de portafolio para Dulce Miga, una microempresa de tortas tradicionales personalizadas. Incluye catalogo, propuesta de servicio, formulario de pedidos y preparacion para Supabase.

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta el SQL de `supabase/schema.sql` en el SQL Editor.
3. Copia `.env.example` como `.env` y agrega:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

El formulario registra pedidos en `public.orders`. Las tablas tienen RLS activado y solo permiten inserciones publicas desde el cliente.

## Despliegue en GitHub Pages

El workflow `.github/workflows/pages.yml` compila la app y la publica en GitHub Pages. Para activar Supabase en produccion, agrega los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el repositorio.
