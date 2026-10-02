-- Migración 011 · Cierra la escritura anónima. Córrela DESPUÉS de desplegar el código nuevo y probar un reporte.
-- Desde ahora los reportes entran solo por la API (con CAPTCHA y validación); nadie puede insertar directo a la base.
drop policy if exists "crear reporte" on reports;
drop policy if exists "crear caso" on welfare_reports;
drop policy if exists "subir fotos de reportes" on storage.objects;
