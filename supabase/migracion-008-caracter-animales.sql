-- Migración 008 · Carácter de los animales (para "Encuentra tu match"). Se puede correr más de una vez.
-- Todas las columnas aceptan vacío: "sin dato" cuenta como neutral al recomendar.
alter table animals add column if not exists size      text check (size      in ('pequeno','mediano','grande'));
alter table animals add column if not exists energy    text check (energy    in ('tranquilo','moderado','activo'));
alter table animals add column if not exists age_group text check (age_group in ('cachorro','joven','adulto','senior'));
alter table animals add column if not exists good_kids text check (good_kids in ('si','no'));
alter table animals add column if not exists good_pets text check (good_pets in ('si','no'));
