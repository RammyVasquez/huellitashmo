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

## Monitoreo y respaldos
- `/api/health` responde 200 solo si el sitio y la base funcionan. Conéctalo a un monitor externo gratuito (p. ej. UptimeRobot)
  con intervalo de 5 minutos: te avisa si se cae y, al consultar la base, evita que Supabase pause un proyecto sin actividad.
- `vercel.json` programa `/api/cron/diario` (8:00 hora de Hermosillo): toca la base y manda un resumen de pendientes por Telegram.
  Requiere la variable `CRON_SECRET`.
- Panel → Respaldo: descarga todos los datos (JSON) y métricas sin datos personales (CSV). El panel avisa si pasan 7 días sin respaldo.

## Adopciones
Requiere `supabase/migracion-012-adopciones.sql`. Flujo: solicitud pública (`/animales/[id]/adoptar`) → panel Adopciones
(etapas, avisos de compatibilidad, resumen para el refugio) → “Marcar adoptado” programa seguimientos a 1, 3 y 6 meses →
la familia responde en `/seguimiento/[token]`.

## Roles y accesos
Requiere `supabase/migracion-013-roles.sql`. Tres tipos de acceso, que el administrador crea en Panel → Equipo:
- **Administrador/a:** todo.
- **Moderador/a:** reportes de mascotas y casos de rescate.
- **Personal de refugio:** solo su refugio (perfil, animales, necesidades y solicitudes de adopción de sus animales).
Las cuentas se crean desde el servidor (`/api/equipo`, con llave de servicio) con una contraseña temporal que se muestra una sola vez; la persona
debe cambiarla al entrar. La separación de datos la exige la base de datos (RLS), no solo la interfaz.

## Avisos por correo a refugios
Requiere `supabase/migracion-016-correo-refugios.sql`. Cada refugio tiene un correo privado para avisos (tabla `shelter_private`,
nunca pública) que se llena en Panel → Refugios (o “Mi refugio”). Cuando llega una solicitud de adopción o responden un seguimiento,
el refugio recibe un correo SIN datos personales de las familias, con una liga al panel. El envío usa Gmail con contraseña de aplicación
(`GMAIL_USER`, `GMAIL_APP_PASSWORD`) o Resend (`RESEND_API_KEY`, `NOTIFY_EMAIL_FROM`).

## Importar animales desde Excel
Panel → Animales → “Importar varios animales desde Excel o CSV”. Plantilla descargable, vista previa con errores y duplicados, hasta 300 filas.

## Impacto, historias, eventos y kit para compartir
Requiere `supabase/migracion-017-impacto-historias-eventos.sql` y `npm install` (agrega `pdf-lib`).
- `/impacto`: gráficas por mes (vista `impact_by_month`, solo conteos) y botón “Descargar informe en PDF” (`/api/informe`).
- `/historias`: historias “Encontró hogar”; solo se publican con autorización de la familia (del seguimiento o registrada a mano).
- `/eventos`: jornadas de adopción, esterilización y acopio; al marcarse “realizado” se capturan los resultados, que alimentan Impacto.
- `/animales/[id]/kit`: imagen cuadrada (`/api/kit/[id]/imagen`) y texto listos para publicar.

## Quiénes somos, visitas por origen, "en cuidados", app instalable y recuperación de contraseña
Requiere `supabase/migracion-018-visitas-cuidados-recuperacion.sql`.
- `/nosotros`: quién está detrás, por qué es gratis y cómo sumarse. Muestra el correo de `NEXT_PUBLIC_CONTACT_EMAIL`.
- Visitas por origen (sin cookies, sin IP): `VisitaCounter` suma una visita por sesión y fuente (`?ref=...` o sitio de procedencia). Se ven en Panel → Respaldo. Abre `/?nocontar=1` en tus dispositivos para no contarte.
- Estado `en_cuidados`: el animal se muestra sin botón de adoptar (puede apadrinarse), no aparece en la portada ni en "Encuentra tu match" y el formulario de adopción lo rechaza.
- App instalable: `manifest.ts` e íconos en `public/icons` y `src/app`.
- Recuperar contraseña: `/admin/recuperar` envía un enlace por correo (Gmail) y `/admin/restablecer` guarda la contraseña nueva.
  En Supabase → Authentication → URL Configuration: Site URL `https://huellitashmo.site` y agrega `https://huellitashmo.site/admin/restablecer` a Redirect URLs.

## Registro de padrinos
Requiere `supabase/migracion-019-padrinos.sql`. Cada apadrinamiento se anota en Panel → Padrinos (nombre o apodo, qué cubre, desde cuándo, contacto opcional). El número de padrinos de cada animal (vigentes) se calcula con un disparador en la base y la cifra “padrinos” de Impacto cuenta todos los registros. Los nombres y contactos son privados.

## Contacto por animal
Requiere `supabase/migracion-020-contacto-por-animal.sql`. Cada animal puede tener su propio contacto (nombre y WhatsApp) para quien rescata con más de una persona; si no lo tiene, se usa el WhatsApp del refugio. Se captura en el formulario del animal o con las columnas `contacto_nombre` y `contacto_whatsapp` de la plantilla de importación.

## Encontrar mascotas perdidas
Requiere `supabase/migracion-021-detalle-reservado.sql`.
- Al enviar un reporte, la persona ve de inmediato los reportes del tipo contrario (misma especie, cerca y recientes): `CoincidenciasRapidas`.
- El formulario pide “señas particulares” y, en mascotas encontradas, un detalle reservado (nunca público) para confirmar al dueño.
- Al publicar un reporte en el panel, `/api/coincidencias` busca posibles coincidencias (distancia, zona y rasgos en común; sin IA) y avisa por Telegram.
- Kit para compartir de reportes: `/reportes/[id]/kit` (imagen cuadrada con QR y texto; no incluye teléfonos).
