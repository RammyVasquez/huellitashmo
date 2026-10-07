-- Migración 019 · Registro de padrinos. Cada apadrinamiento queda anotado (quién, qué cubre, desde cuándo) y el número se calcula solo. Se puede correr más de una vez.

create table if not exists sponsorships (
  id           uuid primary key default gen_random_uuid(),
  animal_id    uuid not null references animals(id) on delete cascade,
  shelter_id   uuid not null references shelters(id) on delete cascade,
  sponsor_name text not null check (char_length(sponsor_name) between 2 and 80),   -- nombre o apodo; NO se publica
  contact      text check (contact is null or char_length(contact) <= 120),        -- opcional; NO se publica
  support      text not null check (char_length(support) between 2 and 160),       -- qué cubre
  started_on   date not null default (now() at time zone 'America/Hermosillo')::date,
  ended_on     date check (ended_on is null or ended_on >= started_on),
  note         text check (note is null or char_length(note) <= 400),
  created_at   timestamptz default now()
);
create index if not exists sponsorships_animal_idx on sponsorships(animal_id);
alter table sponsorships enable row level security;

drop policy if exists "admin padrinos" on sponsorships;
drop policy if exists "refugio padrinos" on sponsorships;
create policy "admin padrinos" on sponsorships for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "refugio padrinos" on sponsorships for all to authenticated
  using (shelter_id = public.my_shelter_id())
  with check (
    shelter_id = public.my_shelter_id()
    and exists (select 1 from animals a where a.id = animal_id and a.shelter_id = sponsorships.shelter_id)
  );

-- El número de padrinos de cada animal = apadrinamientos vigentes (sin fecha de término)
create or replace function public.sync_sponsors() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    update animals set sponsors = (select count(*) from sponsorships where animal_id = new.animal_id and ended_on is null) where id = new.animal_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.animal_id <> new.animal_id) then
    update animals set sponsors = (select count(*) from sponsorships where animal_id = old.animal_id and ended_on is null) where id = old.animal_id;
  end if;
  return null;
end $$;
drop trigger if exists sponsorships_sync on sponsorships;
create trigger sponsorships_sync after insert or update or delete on sponsorships
  for each row execute function public.sync_sponsors();

-- Los números tecleados a mano dejan de valer: desde ahora salen del registro
update animals a set sponsors = (select count(*) from sponsorships s where s.animal_id = a.id and s.ended_on is null);

-- Cifra pública: apadrinamientos registrados (vigentes y terminados)
create or replace view impact_stats as
  select
    (select count(*) from reports where status <> 'pendiente')                  as reportes,
    (select count(*) from reports where status = 'reunificado')                 as reunificaciones,
    (select count(*) from animals)                                              as animales_registrados,
    (select count(*) from animals where status = 'adoptado')                    as adopciones,
    (select count(*) from animals where sterilized)                             as esterilizados,
    (select count(*) from sponsorships)                                         as padrinos,
    (select count(*) from welfare_reports where status = 'resuelto')            as auxiliados,
    (select count(*) from adoption_followups where status = 'respondido')       as seguimientos,
    (select count(*) from events where status = 'realizado')                    as eventos,
    (select count(*) from stories where status = 'publicada')                   as historias;
grant select on impact_stats to anon, authenticated;
