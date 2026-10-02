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

## Panel de administración (/admin)
1. En Supabase > Authentication > Users: crea tu usuario (correo + contraseña, con Auto Confirm).
2. Corre `supabase/migracion-004-admins.sql` (cambia `TU_CORREO@ejemplo.com` por tu correo).
3. En Authentication, desactiva que se puedan registrar usuarios nuevos.
4. Entra a `/admin`. Solo las cuentas en la tabla `admins` pueden escribir datos.

## Tarjetas al compartir
Define `NEXT_PUBLIC_SITE_URL` con la dirección pública (Vercel). Para probar cómo se ve una liga en Facebook,
usa el “Depurador de recursos compartidos” de Facebook con la liga ya publicada (no funciona con localhost).

## Coincidencias por foto (panel)
En /admin > Reportes, “Buscar coincidencias” compara las fotos con las de reportes del tipo contrario usando CLIP,
que corre en el navegador del administrador (la librería se carga desde jsDelivr, versión fija 3.8.1). La primera vez
descarga ~90 MB del modelo desde Hugging Face. Es una sugerencia visual; siempre se confirma con las personas.
Requiere `supabase/migracion-009-embeddings.sql`.

## Rescate (animales heridos, enfermos o maltratados)
Requiere `supabase/migracion-010-rescate.sql`. Los casos de maltrato, abandono/encierro y “otro” NUNCA se publican
(la vista `welfare_public` solo incluye atropellado/herido y enfermo, con ubicación redondeada y sin teléfonos).
El panel tiene la pestaña “Rescates” y una lista editable de contactos de ayuda que se muestra en /rescate.

## Avisos y CAPTCHA
- Los reportes ya no se insertan desde el navegador: pasan por `/api/reportes` y `/api/rescate`, que verifican el CAPTCHA
  (Cloudflare Turnstile), validan los datos, suben las fotos y avisan al administrador.
- Telegram: habla con @BotFather (`/newbot`) y guarda el token; escríbele un mensaje a tu bot y abre
  `https://api.telegram.org/bot<TOKEN>/getUpdates` para leer tu `chat id`. Los avisos NO incluyen teléfonos ni el texto del reporte.
- Después de desplegar y probar, corre `supabase/migracion-011-cerrar-escritura-publica.sql` para cerrar la escritura anónima.
