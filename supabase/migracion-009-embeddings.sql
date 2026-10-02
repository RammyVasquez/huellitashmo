-- Migración 009 · Huella visual de las fotos de cada reporte (solo la usa el panel de administración).
-- La vista pública reports_public NO incluye esta columna.
alter table reports add column if not exists embeddings jsonb;
