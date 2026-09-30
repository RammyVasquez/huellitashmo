-- Migración 002 · Donativos en especie (sin dinero). Se puede correr más de una vez sin problema.

alter table shelters drop column if exists payment_url;
alter table shelters add column if not exists address text;
alter table shelters add column if not exists drop_off_hours text;

create table if not exists shelter_needs (
  id          uuid primary key default gen_random_uuid(),
  shelter_id  uuid not null references shelters(id) on delete cascade,
  item        text not null,
  detail      text,
  urgent      boolean not null default false,
  fulfilled   boolean not null default false,
  created_at  timestamptz default now()
);

alter table shelter_needs enable row level security;
drop policy if exists "ver necesidades" on shelter_needs;
drop policy if exists "admin necesidades" on shelter_needs;
create policy "ver necesidades" on shelter_needs for select using (true);
create policy "admin necesidades" on shelter_needs for all to authenticated using (true) with check (true);

-- Datos de prueba
update shelters set
  address = 'Dirección de prueba, Hermosillo',
  drop_off_hours = 'Sábados y domingos de 10:00 a 14:00'
where name = 'Refugio de Prueba';

delete from shelter_needs where shelter_id in (select id from shelters where name = 'Refugio de Prueba');

insert into shelter_needs (shelter_id, item, detail, urgent)
select id, 'Croquetas para perro adulto', 'Bultos de 20 kg, cualquier marca', true
from shelters where name = 'Refugio de Prueba';

insert into shelter_needs (shelter_id, item, detail, urgent)
select id, 'Cobijas y toallas usadas', 'Limpias, para las camas', false
from shelters where name = 'Refugio de Prueba';

insert into shelter_needs (shelter_id, item, detail, urgent)
select id, 'Arena para gato', null, false
from shelters where name = 'Refugio de Prueba';
