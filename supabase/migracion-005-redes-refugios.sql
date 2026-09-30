-- Migración 005 · Redes sociales de los refugios. Se puede correr más de una vez.
alter table shelters add column if not exists facebook_url text;
alter table shelters add column if not exists instagram_url text;
