-- Migración 004 · Solo los administradores escriben. Se puede correr más de una vez.
-- ANTES: crea tu usuario en Supabase > Authentication > Users > Add user (correo + contraseña, con "Auto Confirm User").
-- Cambia TU_CORREO@ejemplo.com por ese mismo correo en la última sentencia.

create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table admins enable row level security;   -- sin políticas: nadie la lee directo

create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Las políticas "admin" ahora exigen estar en la tabla admins (no basta con tener sesión)
drop policy if exists "admin refugios"    on shelters;
drop policy if exists "admin animales"    on animals;
drop policy if exists "admin reportes"    on reports;
drop policy if exists "admin necesidades" on shelter_needs;
create policy "admin refugios"    on shelters       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin animales"    on animals        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin reportes"    on reports        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin necesidades" on shelter_needs  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin fotos" on storage.objects;
create policy "admin fotos" on storage.objects for all to authenticated
  using (bucket_id = 'fotos' and public.is_admin())
  with check (bucket_id = 'fotos' and public.is_admin());

-- Darte de alta como administrador
insert into admins (user_id)
select id from auth.users where email = 'TU_CORREO@ejemplo.com'
on conflict do nothing;
