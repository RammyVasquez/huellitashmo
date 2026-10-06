-- Migración 014 · Código corto por reporte (para carteles con QR y ligas cortas). Se puede correr más de una vez.
alter table reports add column if not exists code text
  generated always as (substr(replace(id::text, '-', ''), 1, 10)) stored;
create index if not exists reports_code_idx on reports (code);

-- Misma vista pública de antes (con ubicación redondeada y sin teléfonos) + el código corto al final
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
    photos,
    code
  from reports
  where status in ('activo','reunificado');

grant select on reports_public to anon, authenticated;
