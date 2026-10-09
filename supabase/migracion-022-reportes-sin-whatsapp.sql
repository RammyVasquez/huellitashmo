-- Migración 022 · Reportes de mascotas sin WhatsApp obligatorio + "Tengo información". Se puede correr más de una vez.

-- 1) El WhatsApp de quien reporta pasa a ser opcional
alter table reports alter column contact_whatsapp drop not null;

-- 2) La vista pública avisa si el reporte tiene contacto (nunca expone el número)
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
    code,
    (contact_whatsapp is not null) as has_contact
  from reports
  where status in ('activo','reunificado');
grant select on reports_public to anon, authenticated;

-- 3) Información que manda la gente sobre un reporte (solo la ve el equipo)
create table if not exists report_tips (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references reports(id) on delete cascade,
  message    text not null check (char_length(message) between 5 and 600),
  contact    text check (contact is null or char_length(contact) <= 80),
  created_at timestamptz default now()
);
create index if not exists report_tips_report_idx on report_tips(report_id);
alter table report_tips enable row level security;
drop policy if exists "equipo ve informes" on report_tips;
drop policy if exists "equipo borra informes" on report_tips;
create policy "equipo ve informes" on report_tips for select to authenticated using (public.is_admin() or public.is_moderator());
create policy "equipo borra informes" on report_tips for delete to authenticated using (public.is_admin() or public.is_moderator());
