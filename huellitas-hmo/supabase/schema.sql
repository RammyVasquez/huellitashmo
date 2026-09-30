-- Huellitas HMO · esquema inicial. Pégalo en Supabase > SQL Editor > Run.

-- ============ TABLAS ============
create table shelters (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  whatsapp     text,            -- solo dígitos con lada, ej. 5216621234567
  address      text,            -- dónde se entregan donativos en especie
  drop_off_hours text,          -- horario de recepción
  created_at   timestamptz default now()
);

create table animals (
  id          uuid primary key default gen_random_uuid(),
  shelter_id  uuid references shelters(id) on delete set null,
  name        text not null,
  species     text not null check (species in ('perro','gato','otro')),
  sex         text check (sex in ('macho','hembra')),
  age_text    text,             -- "2 años", "cachorro"...
  description text,
  photo_url   text,
  status      text not null default 'disponible'
              check (status in ('disponible','en_proceso','adoptado')),
  sterilized  boolean not null default false,
  vaccinated  boolean not null default false,
  sponsorable boolean not null default false,  -- aparece en "Apadrinar"
  sponsors    int not null default 0,          -- lo actualiza el refugio a mano
  created_at  timestamptz default now(),
  adopted_at  timestamptz
);

create table reports (
  id               uuid primary key default gen_random_uuid(),
  kind             text not null check (kind in ('perdido','encontrado')),
  species          text not null check (species in ('perro','gato','otro')),
  description      text not null,
  photo_url        text,
  lat              double precision,
  lng              double precision,
  zone             text,        -- colonia
  contact_whatsapp text not null,  -- PRIVADO: nunca se expone en la vista pública
  status           text not null default 'pendiente'
                   check (status in ('pendiente','activo','reunificado','cerrado')),
  created_at       timestamptz default now(),
  resolved_at      timestamptz
);

create table shelter_needs (
  id          uuid primary key default gen_random_uuid(),
  shelter_id  uuid not null references shelters(id) on delete cascade,
  item        text not null,
  detail      text,
  urgent      boolean not null default false,
  fulfilled   boolean not null default false,
  created_at  timestamptz default now()
);

-- ============ VISTAS PÚBLICAS ============
-- Sin teléfono y solo reportes ya moderados.
create view reports_public as
  select id, kind, species, description, photo_url, lat, lng, zone, status, created_at
  from reports
  where status in ('activo','reunificado');

create view impact_stats as
  select
    (select count(*) from reports where status <> 'pendiente')           as reportes,
    (select count(*) from reports where status = 'reunificado')          as reunificaciones,
    (select count(*) from animals)                                       as animales_registrados,
    (select count(*) from animals where status = 'adoptado')             as adopciones,
    (select count(*) from animals where sterilized)                      as esterilizados,
    (select coalesce(sum(sponsors),0) from animals)                      as padrinos;

-- ============ SEGURIDAD (RLS) ============
alter table shelters enable row level security;
alter table animals  enable row level security;
alter table reports  enable row level security;
alter table shelter_needs enable row level security;

-- Público: ver refugios y animales
create policy "ver refugios"  on shelters for select using (true);
create policy "ver animales"  on animals  for select using (true);
create policy "ver necesidades" on shelter_needs for select using (true);
create policy "admin necesidades" on shelter_needs for all to authenticated using (true) with check (true);

-- Público: crear un reporte (siempre entra como 'pendiente' para moderación)
create policy "crear reporte" on reports for insert to anon
  with check (status = 'pendiente');

-- Admin (usuario autenticado en Supabase Auth): todo
create policy "admin refugios" on shelters for all to authenticated using (true) with check (true);
create policy "admin animales" on animals  for all to authenticated using (true) with check (true);
create policy "admin reportes" on reports  for all to authenticated using (true) with check (true);

-- La tabla reports NO es legible por el público (tiene teléfonos). Solo las vistas.
grant select on reports_public, impact_stats to anon, authenticated;

-- ============ STORAGE ============
-- Crea el bucket 'fotos' (público) en Storage y luego corre esto:
-- create policy "subir fotos de reportes" on storage.objects for insert to anon
--   with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'reportes');
-- create policy "admin fotos" on storage.objects for all to authenticated
--   using (bucket_id = 'fotos') with check (bucket_id = 'fotos');
