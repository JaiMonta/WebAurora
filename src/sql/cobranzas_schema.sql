-- ====================================================================
-- SCRIPT ROBUSTO DE ACTUALIZACIÓN DE COBRANZAS (WEBAURORA)
-- Copiar y ejecutar en el SQL Editor de Supabase
-- ====================================================================

-- 1. Crear la tabla de cobranzas si no existe
CREATE TABLE IF NOT EXISTS cobranzas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    id_inmueble TEXT NOT NULL,
    periodo VARCHAR(10) NOT NULL DEFAULT '2026-07',
    monto_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    monto_bs NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tasa_cambio NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'sin_reportar',
    referencia VARCHAR(100),
    comprobante_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asegurar primero que la columna 'periodo' exista en la tabla
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cobranzas' 
          AND column_name = 'periodo'
    ) THEN
        ALTER TABLE cobranzas ADD COLUMN periodo VARCHAR(10) NOT NULL DEFAULT '2026-07';
    END IF;
END $$;

-- 3. Limpiar registros duplicados existentes conservando el más reciente por (id_inmueble, periodo)
DELETE FROM cobranzas a
USING cobranzas b
WHERE a.id_inmueble = b.id_inmueble 
  AND a.periodo = b.periodo 
  AND (
    a.created_at < b.created_at 
    OR (a.created_at = b.created_at AND a.ctid < b.ctid)
  );

-- 4. Re-crear la restricción UNIQUE por (id_inmueble, periodo)
ALTER TABLE cobranzas 
    DROP CONSTRAINT IF EXISTS unique_inmueble_periodo;

ALTER TABLE cobranzas 
    ADD CONSTRAINT unique_inmueble_periodo UNIQUE (id_inmueble, periodo);

-- 5. Habilitar RLS y Políticas de Acceso
ALTER TABLE cobranzas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de cobranzas" ON cobranzas;
CREATE POLICY "Permitir lectura de cobranzas"
    ON cobranzas FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Permitir insertar cobranzas" ON cobranzas;
CREATE POLICY "Permitir insertar cobranzas"
    ON cobranzas FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizar cobranzas" ON cobranzas;
CREATE POLICY "Permitir actualizar cobranzas"
    ON cobranzas FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminar cobranzas" ON cobranzas;
CREATE POLICY "Permitir eliminar cobranzas"
    ON cobranzas FOR DELETE TO public USING (true);
