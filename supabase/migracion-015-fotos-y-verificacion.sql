-- Migración 015 · Varias fotos por animal, tipo de refugio y sello de verificación. Se puede correr más de una vez.

-- Fotos de animales (la primera es la principal; photo_url se mantiene igual a la primera)
alter table animals add column if not exists photos text[] not null default '{}';
update animals set photos = array[photo_url] where photo_url is not null and cardinality(photos) = 0;

-- Tipo de refugio y verificación
alter table shelters add column if not exists kind text not null default 'refugio'
  check (kind in ('refugio','hogar_temporal','rescatista','colectivo'));
alter table shelters add column if not exists verified_at timestamptz;

-- Solo un administrador puede poner o quitar el sello (el personal de refugio edita su perfil pero no se verifica solo)
create or replace function public.shelters_proteger_verificacion() returns trigger
language plpgsql as $$
begin
  if new.verified_at is distinct from old.verified_at and auth.uid() is not null and not public.is_admin() then
    raise exception 'Solo un administrador puede verificar un refugio';
  end if;
  return new;
end $$;

drop trigger if exists shelters_proteger_verificacion on shelters;
create trigger shelters_proteger_verificacion before update on shelters
  for each row execute function public.shelters_proteger_verificacion();
