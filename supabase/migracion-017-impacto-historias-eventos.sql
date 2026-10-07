-- Migración 017 · Cifras por mes, historias "Encontró hogar" y eventos/jornadas. Se puede correr más de una vez.

-- ============ 1) Cifras por mes (solo conteos: sin datos personales) ============
create or replace view impact_by_month as
select
  m.mes::date as mes,
  (select count(*) from reports r where r.status <> 'pendiente'
     and date_trunc('month', r.created_at at time zone 'America/Hermosillo') = m.mes)                         as reportes,
  (select count(*) from reports r where r.status = 'reunificado'
     and date_trunc('month', coalesce(r.resolved_at, r.created_at) at time zone 'America/Hermosillo') = m.mes) as reunificaciones,
  (select count(*) from welfare_reports w where w.status <> 'pendiente'
     and date_trunc('month', w.created_at at time zone 'America/Hermosillo') = m.mes)                         as rescates,
  (select count(*) from welfare_reports w where w.status = 'resuelto'
     and date_trunc('month', coalesce(w.resolved_at, w.created_at) at time zone 'America/Hermosillo') = m.mes) as auxiliados,
  (select count(*) from animals a
     where date_trunc('month', a.created_at at time zone 'America/Hermosillo') = m.mes)                       as animales_registrados,
  (select count(*) from animals a where a.status = 'adoptado'
     and date_trunc('month', coalesce(a.adopted_at, a.created_at) at time zone 'America/Hermosillo') = m.mes) as adopciones,
  (select count(*) from adoption_requests q
     where date_trunc('month', q.created_at at time zone 'America/Hermosillo') = m.mes)                       as solicitudes,
  (select count(*) from adoption_followups f where f.status = 'respondido'
     and date_trunc('month', f.answered_at at time zone 'America/Hermosillo') = m.mes)                        as seguimientos
from generate_series(
  date_trunc('month', now() at time zone 'America/Hermosillo') - interval '11 months',
  date_trunc('month', now() at time zone 'America/Hermosillo'),
  interval '1 month') as m(mes)
order by m.mes;

grant select on impact_by_month to anon, authenticated;

-- ============ 2) Historias "Encontró hogar" ============
create table if not exists stories (
  id            uuid primary key default gen_random_uuid(),
  animal_id     uuid references animals(id) on delete set null,
  shelter_id    uuid not null references shelters(id) on delete cascade,
  followup_id   uuid references adoption_followups(id) on delete set null,
  title         text not null,
  body          text not null,
  family_label  text,                                   -- opcional, ej. "Una familia de Hermosillo"
  photos        text[] not null default '{}',
  consent_basis text not null check (consent_basis in ('seguimiento','manual')),
  consent_note  text,                                   -- cómo se obtuvo el permiso si fue manual
  status        text not null default 'borrador' check (status in ('borrador','publicada')),
  published_at  timestamptz,
  created_at    timestamptz default now()
);
alter table stories enable row level security;
drop policy if exists "ver historias publicadas" on stories;
drop policy if exists "admin historias" on stories;
drop policy if exists "refugio historias" on stories;
create policy "ver historias publicadas" on stories for select using (status = 'publicada');
create policy "admin historias" on stories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "refugio historias" on stories for all to authenticated
  using (shelter_id = public.my_shelter_id()) with check (shelter_id = public.my_shelter_id());

-- ============ 3) Eventos y jornadas ============
create table if not exists events (
  id                   uuid primary key default gen_random_uuid(),
  shelter_id           uuid references shelters(id) on delete set null,   -- vacío = lo organiza el equipo de la plataforma
  title                text not null,
  kind                 text not null check (kind in ('adopcion','esterilizacion','acopio','otro')),
  description          text,
  starts_at            timestamptz not null,
  ends_at              timestamptz,
  place                text,                 -- lugar PÚBLICO (parque, plaza, clínica)
  address              text,
  status               text not null default 'programado' check (status in ('programado','realizado','cancelado')),
  attendees            int check (attendees >= 0),
  adoptions_count      int check (adoptions_count >= 0),
  sterilizations_count int check (sterilizations_count >= 0),
  results_note         text,
  photos               text[] not null default '{}',
  created_at           timestamptz default now()
);
alter table events enable row level security;
drop policy if exists "ver eventos" on events;
drop policy if exists "admin eventos" on events;
drop policy if exists "refugio eventos" on events;
create policy "ver eventos" on events for select using (status in ('programado','realizado'));
create policy "admin eventos" on events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "refugio eventos" on events for all to authenticated
  using (shelter_id = public.my_shelter_id()) with check (shelter_id = public.my_shelter_id());

-- ============ 4) Contador público: + eventos realizados e historias publicadas ============
create or replace view impact_stats as
  select
    (select count(*) from reports where status <> 'pendiente')                  as reportes,
    (select count(*) from reports where status = 'reunificado')                 as reunificaciones,
    (select count(*) from animals)                                              as animales_registrados,
    (select count(*) from animals where status = 'adoptado')                    as adopciones,
    (select count(*) from animals where sterilized)                             as esterilizados,
    (select coalesce(sum(sponsors),0) from animals)                             as padrinos,
    (select count(*) from welfare_reports where status = 'resuelto')            as auxiliados,
    (select count(*) from adoption_followups where status = 'respondido')       as seguimientos,
    (select count(*) from events where status = 'realizado')                    as eventos,
    (select count(*) from stories where status = 'publicada')                   as historias;

grant select on impact_stats to anon, authenticated;
