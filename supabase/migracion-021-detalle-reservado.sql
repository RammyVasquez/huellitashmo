-- Migración 021 · Detalle reservado en reportes de mascotas encontradas (solo lo ve el equipo; sirve para confirmar al dueño). Se puede correr más de una vez.
alter table reports add column if not exists private_detail text
  check (private_detail is null or char_length(private_detail) <= 300);
-- La vista pública reports_public NO incluye esta columna.
