-- Agregar soporte para sincronización de carrito en la nube
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cart JSONB DEFAULT '[]';

-- Asegurar que la política de actualización cubra la nueva columna
-- (Las políticas existentes en profiles_schema.sql ya permiten UPDATE basándose en ID)
