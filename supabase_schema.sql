-- SQL Schema for D&E Shop (Supabase)
-- Ejecuta este código en el Editor SQL de tu proyecto de Supabase.

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    old_price NUMERIC,
    category TEXT,
    stock INTEGER DEFAULT 0,
    badge TEXT,
    badge_type TEXT,
    image TEXT,
    images JSONB DEFAULT '[]',
    variants JSONB DEFAULT '[]', -- Tallas y colores
    reviews JSONB DEFAULT '[]',
    similar_ids JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pendiente',
    customer_name TEXT,
    customer_email TEXT,
    items JSONB DEFAULT '[]',
    subtotal NUMERIC,
    shipping_cost NUMERIC,
    total NUMERIC,
    shipping_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Clientes (Customers)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hash
    phone TEXT,
    address TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Banners/Configuración
-- Nota: Para simplificar, usamos una sola fila 'main'
CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY DEFAULT 'main',
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de PRODUCTOS (Lectura pública, Escritura solo por Admin)
CREATE POLICY "Productos: Lectura Pública" ON products FOR SELECT USING (true);
CREATE POLICY "Productos: Solo Admin puede insertar/editar" ON products 
    FOR ALL USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com') 
    WITH CHECK (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

-- 2. Políticas de CATEGORÍAS
CREATE POLICY "Categorías: Lectura Pública" ON categories FOR SELECT USING (true);
CREATE POLICY "Categorías: Solo Admin" ON categories FOR ALL USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

-- 3. Políticas de PEDIDOS (Escritura pública, Lectura protegida)
-- Un cliente puede insertar su pedido, pero no leer los de otros.
CREATE POLICY "Pedidos: Clientes pueden insertar" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Pedidos: Lectura solo por Admin" ON orders FOR SELECT USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');
CREATE POLICY "Pedidos: Gestión solo por Admin" ON orders FOR UPDATE USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

-- 4. Políticas de CLIENTES
CREATE POLICY "Clientes: Solo Admin puede ver lista" ON customers FOR SELECT USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');
CREATE POLICY "Clientes: Registro público" ON customers FOR INSERT WITH CHECK (true);

-- 5. Políticas de BANNERS
CREATE POLICY "Banners: Lectura Pública" ON banners FOR SELECT USING (true);
CREATE POLICY "Banners: Solo Admin" ON banners FOR ALL USING (auth.jwt() ->> 'email' = 'l272727d@gmail.com');

-- NOTA DE SEGURIDAD: 
-- Para que el Web Admin funcione con estas políticas restrictivas, se debe usar la clave service_role
-- únicamente en el panel de administración privado, NUNCA en el index público.

-- 6. HABILITAR PUBLICACIÓN EN TIEMPO REAL (Realtime)
-- Esto permite que los clientes reciban actualizaciones instantáneas.
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE banners;
