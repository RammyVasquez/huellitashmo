-- Migración 012 · Solicitudes de adopción y seguimiento post-adopción. Se puede correr más de una vez.
-- Solo los administradores leen estas tablas. El público escribe únicamente a través de la API (con CAPTCHA).

create table if not exists adoption_requests (
  id                 uuid primary key default gen_random_uuid(),
  animal_id          uuid not null references animals(id) on delete cascade,
  applicant_name     text not null,
  whatsapp           text not null,
  colonia            text not null,
  housing            text not null check (housing in ('casa_patio','casa_sin_patio','departamento','otro')),
  tenure             text not null check (tenure in ('propia','renta')),
  landlord_ok        boolean,                       -- si renta: ¿tiene permiso del propietario? (null = aún no pregunta)
  household_size     int  not null check (household_size between 1 and 30),
  has_kids           boolean not null,
  has_pets           boolean not null,
  pets_note          text,
  experience         text,
  away_plan          text,
  motivation         text not null,
  agrees_visit       boolean not null default false,
  agrees_commitment  boolean not null default false,
  status             text not null default 'nueva'
                     check (status in ('nueva','contactado','entrevista','visita','aprobada','rechazada','adoptado','cancelada')),
  admin_notes        text,
  adopted_at         timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists adoption_followups (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references adoption_requests(id) on delete cascade,
  token          text not null unique default replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''),
  stage          int  not null check (stage in (1,3,6)),   -- meses después de la adopción
  due_date       date not null,
  status         text not null default 'pendiente' check (status in ('pendiente','enviado','respondido','omitido')),
  sent_at        timestamptz,
  answered_at    timestamptz,
  adapted        text check (adapted in ('muy_bien','bien','con_dificultades')),
  notes          text,
  photos         text[] not null default '{}',
  photo_consent  boolean not null default false,
  created_at     timestamptz default now()
);

alter table adoption_requests enable row level security;
alter table adoption_followups enable row level security;
drop policy if exists "admin solicitudes" on adoption_requests;
drop policy if exists "admin seguimientos" on adoption_followups;
create policy "admin solicitudes" on adoption_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin seguimientos" on adoption_followups for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Contador público: se agrega "seguimientos" (respondidos) al final
create or replace view impact_stats as
  select
    (select count(*) from reports where status <> 'pendiente')           as reportes,
    (select count(*) from reports where status = 'reunificado')          as reunificaciones,
    (select count(*) from animals)                                       as animales_registrados,
    (select count(*) from animals where status = 'adoptado')             as adopciones,
    (select count(*) from animals where sterilized)                      as esterilizados,
    (select coalesce(sum(sponsors),0) from animals)                      as padrinos,
    (select count(*) from welfare_reports where status = 'resuelto')     as auxiliados,
    (select count(*) from adoption_followups where status = 'respondido') as seguimientos;

grant select on impact_stats to anon, authenticated;
