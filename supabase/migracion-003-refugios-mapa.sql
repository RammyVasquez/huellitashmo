-- Migración 003 · Logo, descripción y ubicación de los refugios. Se puede correr más de una vez.
alter table shelters add column if not exists logo_url text;           -- enlace público del logo (bucket fotos/logos)
alter table shelters add column if not exists about text;              -- 1-2 frases sobre el refugio
alter table shelters add column if not exists lat double precision;    -- latitud
alter table shelters add column if not exists lng double precision;    -- longitud

-- Datos de prueba (centro de Hermosillo). Cámbialos por los reales del refugio.
update shelters set
  about = 'Refugio de prueba que rescata perros y gatos en situación de calle.',
  lat = 29.0892,
  lng = -110.9613
where name = 'Refugio de Prueba';
