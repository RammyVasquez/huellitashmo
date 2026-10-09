-- Migración 024 · Los moderadores también pueden subir fotos a los reportes (los administradores ya podían). Se puede correr más de una vez.
drop policy if exists "moderador sube fotos de reportes" on storage.objects;
create policy "moderador sube fotos de reportes" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = 'reportes' and public.is_moderator());
