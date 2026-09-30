# Huellitas HMO

Plataforma para refugios y vecinos de Hermosillo: animales en adopción, padrinazgo,
reportes de perdidos/encontrados y contador público de impacto.

## Arranque
1. `npm install`
2. Crea un proyecto en Supabase y corre `supabase/schema.sql` en el SQL Editor.
2b. Corre también `supabase/migracion-002-donativos-en-especie.sql` si ya tenías el esquema anterior.
3. Crea el bucket público `fotos` en Storage y corre las políticas comentadas al final del SQL.
4. Copia `.env.example` a `.env.local` y llena los valores.
5. `npm run dev` → http://localhost:3000
6. Sube a GitHub y conecta el repo en Vercel (agrega las mismas variables de entorno).

## Decisiones de diseño
- El teléfono de quien reporta nunca se expone: la tabla `reports` no es pública; el público solo ve
  `reports_public` y contacta vía `/api/contacto/[id]`.
- Los reportes entran como `pendiente` y se publican tras moderación.
- Sin dinero: donativos y padrinazgo son EN ESPECIE, coordinados por WhatsApp con el refugio; la plataforma no maneja pagos.

## Hoja de ruta (NO construido todavía)
Mapa Leaflet · panel admin · matching por foto · visitas agendadas · seguimiento post-adopción · gamificación
