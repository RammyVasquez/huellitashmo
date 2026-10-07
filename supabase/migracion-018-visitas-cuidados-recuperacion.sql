-- Migración 018 · Visitas por origen (sin cookies), estado "en cuidados" y límite de recuperaciones de contraseña. Se puede correr más de una vez.

-- ============ 1) Visitas por origen: solo conteos por día y fuente, sin datos personales ============
create table if not exists visits_daily (
  day    date not null,
  source text not null,
  visits int  not null default 0,
  primary key (day, source)
);
alter table visits_daily enable row level security;
drop policy if exists "admin ve visitas" on visits_daily;
create policy "admin ve visitas" on visits_daily for select to authenticated using (public.is_admin());

create or replace function public.track_visit(p_source text)
returns void language plpgsql security definer set search_path = public as $$
declare
  s text := lower(coalesce(p_source, ''));
  d date := (now() at time zone 'America/Hermosillo')::date;
begin
  if s !~ '^[a-z0-9_-]{1,30}$' then s := 'otro'; end if;
  -- tope de fuentes distintas por día para que nadie llene la tabla con textos inventados
  if not exists (select 1 from visits_daily where day = d and source = s)
     and (select count(*) from visits_daily where day = d) >= 40 then
    s := 'otro';
  end if;
  insert into visits_daily(day, source, visits) values (d, s, 1)
  on conflict (day, source) do update set visits = visits_daily.visits + 1;
end $$;
revoke all on function public.track_visit(text) from public, anon, authenticated;
grant execute on function public.track_visit(text) to service_role;

-- ============ 2) Animales "en cuidados" (se están recuperando; aún no se pueden adoptar) ============
do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.animals'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.animals drop constraint %I', c.conname);
  end loop;
end $$;
alter table animals add constraint animals_status_check
  check (status in ('disponible','en_proceso','en_cuidados','adoptado'));

-- ============ 3) Límite de envíos de recuperación de contraseña (evita que alguien llene un correo de mensajes) ============
create table if not exists recovery_throttle (
  email   text primary key,
  last_at timestamptz not null default now()
);
alter table recovery_throttle enable row level security; -- sin políticas: solo el servidor la usa
