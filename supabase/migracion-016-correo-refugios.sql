-- Migración 016 · Correo privado de cada refugio para recibir avisos. Se puede correr más de una vez.
-- Va en una tabla aparte porque "shelters" es pública: este correo NUNCA debe poder leerse sin sesión.
create table if not exists shelter_private (
  shelter_id   uuid primary key references shelters(id) on delete cascade,
  notify_email text,
  updated_at   timestamptz default now()
);
alter table shelter_private enable row level security;

drop policy if exists "admin correos de refugios" on shelter_private;
drop policy if exists "refugio gestiona su correo" on shelter_private;
create policy "admin correos de refugios" on shelter_private for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "refugio gestiona su correo" on shelter_private for all to authenticated
  using (shelter_id = public.my_shelter_id()) with check (shelter_id = public.my_shelter_id());
