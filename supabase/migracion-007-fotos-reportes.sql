-- Migración 007 · Varias fotos por reporte. Se puede correr más de una vez.
alter table reports add column if not exists photos text[] not null default '{}';

-- Los reportes anteriores conservan su foto única
update reports set photos = array[photo_url]
where photo_url is not null and cardinality(photos) = 0;

-- Vista pública (mismo redondeo de ubicación que la migración 006) + la lista de fotos al final
create or replace view reports_public as
  select
    id, kind, species, description, photo_url,
    case when lat is null then null
         when kind = 'encontrado' then round(lat::numeric, 2)::double precision
         else round(lat::numeric, 3)::double precision end as lat,
    case when lng is null then null
         when kind = 'encontrado' then round(lng::numeric, 2)::double precision
         else round(lng::numeric, 3)::double precision end as lng,
    zone, status, created_at,
    photos
  from reports
  where status in ('activo','reunificado');

grant select on reports_public to anon, authenticated;
