-- Migración 010 · Reportes de animales heridos, enfermos o maltratados. Se puede correr más de una vez.

create table if not exists welfare_reports (
  id               uuid primary key default gen_random_uuid(),
  category         text not null check (category in ('atropellado_herido','enfermo','maltrato','abandono_encierro','otro')),
  species          text not null check (species in ('perro','gato','otro')),
  urgent           boolean not null default false,
  description      text not null,
  photos           text[] not null default '{}',
  zone             text not null,
  lat              double precision,
  lng              double precision,
  contact_whatsapp text,                          -- opcional: se puede reportar sin dejar datos
  allow_contact    boolean not null default false, -- acepta que quien quiera ayudar le escriba
  status           text not null default 'pendiente'
                   check (status in ('pendiente','activo','en_atencion','resuelto','cerrado')),
  admin_notes      text,
  created_at       timestamptz default now(),
  resolved_at      timestamptz
);

alter table welfare_reports enable row level security;
drop policy if exists "crear caso" on welfare_reports;
drop policy if exists "admin casos" on welfare_reports;
create policy "crear caso" on welfare_reports for insert to anon with check (status = 'pendiente');
create policy "admin casos" on welfare_reports for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Vista pública. PRIVACIDAD: maltrato, abandono/encierro y "otro" involucran a personas o domicilios:
-- NUNCA se publican, aunque el administrador los valide. Solo se muestran animales en la calle
-- (atropellado/herido, enfermo), sin teléfonos y con la ubicación redondeada a ~100 m.
create or replace view welfare_public as
  select
    id, category, species, urgent, description, photos, zone,
    case when lat is null then null else round(lat::numeric, 3)::double precision end as lat,
    case when lng is null then null else round(lng::numeric, 3)::double precision end as lng,
    status, created_at,
    (allow_contact and contact_whatsapp is not null) as allow_contact
  from welfare_reports
  where status in ('activo','en_atencion')
    and category in ('atropellado_herido','enfermo');

grant select on welfare_public to anon, authenticated;

-- Contactos de ayuda (veterinarios, rescatistas, autoridades) que tú verificas y publicas
create table if not exists help_contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  note       text,
  sort       int not null default 0,
  created_at timestamptz default now()
);
alter table help_contacts enable row level security;
drop policy if exists "ver contactos" on help_contacts;
drop policy if exists "admin contactos" on help_contacts;
create policy "ver contactos" on help_contacts for select using (true);
create policy "admin contactos" on help_contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contador público: animales auxiliados (mismas columnas de antes + una nueva al final)
create or replace view impact_stats as
  select
    (select count(*) from reports where status <> 'pendiente')           as reportes,
    (select count(*) from reports where status = 'reunificado')          as reunificaciones,
    (select count(*) from animals)                                       as animales_registrados,
    (select count(*) from animals where status = 'adoptado')             as adopciones,
    (select count(*) from animals where sterilized)                      as esterilizados,
    (select coalesce(sum(sponsors),0) from animals)                      as padrinos,
    (select count(*) from welfare_reports where status = 'resuelto')     as auxiliados;

grant select on impact_stats to anon, authenticated;
