-- Migración 002 · Donativos en especie (sin dinero). Pégala en Supabase > SQL Editor > Run.

-- El refugio ya no usa enlace de pago: ahora indica dónde y cuándo recibe donativos.
alter table shelters drop column if exists payment_url;
alter table shelters add column if not exists address text;          -- dónde se entregan donativos
alter table shelters add column if not exists drop_off_hours text;   -- ej. "Sáb y dom 10:00-14:00"

-- Lista de necesidades del refugio (croquetas, cobijas, medicinas...)
create table if not exists shelter_needs (
  id          uuid primary key default gen_random_uuid(),
  shelter_id  uuid not null references shelters(id) on delete cascade,
  item        text not null,        -- "Croquetas para cachorro"
  detail      text,                 -- "Bultos de 20 kg, cualquier marca"
  urgent      boolean not null default false,
  fulfilled   boolean not null default false,
  created_at  timestamptz default now()
);

alter table shelter_needs enable row level security;
create policy "ver necesidades" on shelter_needs for select using (true);
create policy "admin necesidades" on shelter_needs for all to authenticated using (true) with check (true);

-- Datos de prueba
update shelters set
  address = 'Dirección de prueba, Hermosillo',
  drop_off_hours = 'Sábados y domingos de 10:00 a 14:00'
where name = 'Refugio de Prueba';

insert into shelter_needs (shelter_id, item, detail, urgent)
select id, 'Croquetas para perro adulto', 'Bultos de 20 kg, cualquier marca', true from shelters where name = 'Refugio de Prueba';
insert into shelter_needs (shelter_id, item, detail)
select id, 'Cobijas y toallas usadas', 'Limpias, para las camas', false from shelters where name = 'Refugio de Prueba';
insert into shelter_needs (shelter_id, item, detail)
select id, 'Arena para gato', null, false from shelters where name = 'Refugio de Prueba';
