-- Migración 013 · Roles de acceso: administrador, moderador y personal de refugio. Se puede correr más de una vez.
-- Los administradores siguen en la tabla "admins". Las demás personas viven en "staff".

create table if not exists staff (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  role         text not null check (role in ('admin','moderador','refugio')),
  shelter_id   uuid references shelters(id) on delete cascade,
  email        text,
  display_name text,
  created_at   timestamptz default now(),
  check (role <> 'refugio' or shelter_id is not null)
);
alter table staff enable row level security;
drop policy if exists "admin ve el equipo" on staff;
create policy "admin ve el equipo" on staff for select to authenticated using (public.is_admin());
-- Las altas y bajas las hace el servidor (llave de servicio), nunca el navegador.

-- Los administradores que ya existen aparecen en el listado del equipo
insert into staff (user_id, role, email)
select a.user_id, 'admin', u.email from admins a join auth.users u on u.id = a.user_id
on conflict (user_id) do nothing;

-- ---------- Funciones ----------
create or replace function public.my_access() returns jsonb
language sql security definer set search_path = public stable as $$
  select case
    when exists (select 1 from public.admins where user_id = auth.uid()) then jsonb_build_object('role','admin')
    else (select jsonb_build_object('role', s.role, 'shelter_id', s.shelter_id)
          from public.staff s where s.user_id = auth.uid() and s.role <> 'admin' limit 1)
  end
$$;

create or replace function public.my_shelter_id() returns uuid
language sql security definer set search_path = public stable as $$
  select shelter_id from public.staff where user_id = auth.uid() and role = 'refugio' limit 1
$$;

create or replace function public.is_moderator() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'moderador')
$$;

revoke all on function public.my_access(), public.my_shelter_id(), public.is_moderator() from public;
grant execute on function public.my_access(), public.my_shelter_id(), public.is_moderator() to authenticated;

-- ---------- Personal de refugio: solo lo de SU refugio ----------
drop policy if exists "refugio edita su refugio" on shelters;
create policy "refugio edita su refugio" on shelters for update to authenticated
  using (id = public.my_shelter_id()) with check (id = public.my_shelter_id());

drop policy if exists "refugio gestiona sus animales" on animals;
create policy "refugio gestiona sus animales" on animals for all to authenticated
  using (shelter_id = public.my_shelter_id()) with check (shelter_id = public.my_shelter_id());

drop policy if exists "refugio gestiona sus necesidades" on shelter_needs;
create policy "refugio gestiona sus necesidades" on shelter_needs for all to authenticated
  using (shelter_id = public.my_shelter_id()) with check (shelter_id = public.my_shelter_id());

drop policy if exists "refugio gestiona sus solicitudes" on adoption_requests;
create policy "refugio gestiona sus solicitudes" on adoption_requests for all to authenticated
  using (exists (select 1 from animals a where a.id = animal_id and a.shelter_id = public.my_shelter_id()))
  with check (exists (select 1 from animals a where a.id = animal_id and a.shelter_id = public.my_shelter_id()));

drop policy if exists "refugio gestiona sus seguimientos" on adoption_followups;
create policy "refugio gestiona sus seguimientos" on adoption_followups for all to authenticated
  using (exists (select 1 from adoption_requests r join animals a on a.id = r.animal_id
                 where r.id = request_id and a.shelter_id = public.my_shelter_id()))
  with check (exists (select 1 from adoption_requests r join animals a on a.id = r.animal_id
                      where r.id = request_id and a.shelter_id = public.my_shelter_id()));

-- Puede subir fotos de animales y su logo (solo subir; no modificar ni borrar lo de otros)
drop policy if exists "refugio sube fotos" on storage.objects;
create policy "refugio sube fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] in ('animales','logos') and public.my_shelter_id() is not null);

-- ---------- Moderación: reportes y casos de rescate ----------
drop policy if exists "moderador reportes" on reports;
create policy "moderador reportes" on reports for all to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists "moderador rescates" on welfare_reports;
create policy "moderador rescates" on welfare_reports for all to authenticated
  using (public.is_moderator()) with check (public.is_moderator());
