-- Migración 006 · Mapa de perdidos y encontrados. Se puede correr más de una vez.
-- La vista pública redondea las coordenadas para que la ubicación exacta NUNCA salga de la base:
--   perdido     -> ~100 m de precisión (la familia quiere que la busquen cerca de ahí)
--   encontrado  -> ~1 km (zona aproximada, para evitar que alguien se haga pasar por el dueño)
create or replace view reports_public as
  select
    id, kind, species, description, photo_url,
    case when lat is null then null
         when kind = 'encontrado' then round(lat::numeric, 2)::double precision
         else round(lat::numeric, 3)::double precision end as lat,
    case when lng is null then null
         when kind = 'encontrado' then round(lng::numeric, 2)::double precision
         else round(lng::numeric, 3)::double precision end as lng,
    zone, status, created_at
  from reports
  where status in ('activo','reunificado');

grant select on reports_public to anon, authenticated;
