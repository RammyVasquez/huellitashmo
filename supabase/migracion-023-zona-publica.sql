-- Migración 023 · La zona que se muestra en público no revela la dirección exacta. Se puede correr más de una vez.
-- Encontradas: solo colonia o zona (se quitan calles, números y códigos postales).
-- Perdidas: se conserva la calle, pero sin números de casa ni códigos postales.
create or replace function public.zona_publica(z text, tipo text) returns text
language sql immutable as $$
  select nullif(trim(both ' ,' from coalesce(
    case when tipo = 'encontrado' then
      (select string_agg(seg, ', ') from (
         select trim(s) as seg from unnest(string_to_array(z, ',')) s
       ) t
       where seg <> '' and seg !~ '[0-9]'
         and seg !~* '^(c\.|calle|av\.?|avenida|blvd\.?|boulevard|calz\.?|calzada|prol\.?|prolongaci[oó]n|carretera|camino)(\s|$)'
         and seg !~* '^(son\.?|sonora|m[eé]xico|mx|hermosillo)$')
    else
      (select string_agg(seg, ', ') from (
         select trim(regexp_replace(s, '\s*#?\y[0-9]{1,5}[a-zA-Z]?\y', '', 'g')) as seg from unnest(string_to_array(z, ',')) s
       ) t
       where seg <> '' and seg !~* '^(son\.?|sonora|m[eé]xico|mx|hermosillo)$')
    end,
    trim(regexp_replace(coalesce(z, ''), '[0-9]+', '', 'g'))
  )), '')
$$;

create or replace view reports_public as
  select
    id, kind, species, description, photo_url,
    case when lat is null then null
         when kind = 'encontrado' then round(lat::numeric, 2)::double precision
         else round(lat::numeric, 3)::double precision end as lat,
    case when lng is null then null
         when kind = 'encontrado' then round(lng::numeric, 2)::double precision
         else round(lng::numeric, 3)::double precision end as lng,
    public.zona_publica(zone, kind) as zone,
    status, created_at,
    photos,
    code,
    (contact_whatsapp is not null) as has_contact
  from reports
  where status in ('activo','reunificado');
grant select on reports_public to anon, authenticated;
