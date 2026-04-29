-- ================================================================
-- D&E Shop — Módulo de Proveedores (Privado del Administrador)
-- ✅ VERSIÓN SEGURA: se puede ejecutar múltiples veces sin error.
-- ================================================================

-- 1. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    country TEXT DEFAULT 'DO',
    payment_terms TEXT,
    commission_pct DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Vinculación Producto ↔ Proveedor
CREATE TABLE IF NOT EXISTS supplier_products (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, product_id)
);

-- 3. Habilitar RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas anteriores si existen (evita el error 42710)
DROP POLICY IF EXISTS "Suppliers: Solo Admin" ON suppliers;
DROP POLICY IF EXISTS "Supplier Products: Solo Admin" ON supplier_products;

-- (Por si corriste una versión anterior con nombres en español)
DROP POLICY IF EXISTS "Proveedores: Administración en solitario" ON suppliers;
DROP POLICY IF EXISTS "Proveedores: Administración en solitario" ON supplier_products;
DROP POLICY IF EXISTS "Supplier_products: Solo Admin" ON supplier_products;

-- 5. Crear políticas: SOLO service_role (admin) puede acceder
CREATE POLICY "Suppliers: Solo Admin" ON suppliers
    FOR ALL USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

CREATE POLICY "Supplier Products: Solo Admin" ON supplier_products
    FOR ALL USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

-- ================================================================
-- ✅ LISTO. Las tablas están creadas y protegidas.
-- Solo el Administrador Principal puede ver esta data.
-- ================================================================

