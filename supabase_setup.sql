-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE
-- ==========================================
-- Instrucciones:
-- 1. Ve a tu panel de Supabase: https://supabase.com/dashboard
-- 2. Selecciona tu proyecto.
-- 3. Ve a la sección "SQL Editor" en el menú lateral izquierdo.
-- 4. Crea un nuevo query (New query), pega todo este código y dale a "Run".

-- 1. CREACIÓN DE TABLAS

-- Tabla de Categorías
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    completed_count INTEGER DEFAULT 0
);

-- Tabla de Niveles
CREATE TABLE public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    required_points INTEGER NOT NULL,
    color TEXT NOT NULL
);

-- Tabla de Logros
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 10,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    photo_url TEXT
);

-- Tabla de Estadísticas Globales
CREATE TABLE public.global_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total_points INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    last_activity_date TIMESTAMPTZ,
    total_available_achievements INTEGER DEFAULT 0
);

-- 2. CONFIGURACIÓN DE SEGURIDAD (Row Level Security - RLS)
-- Como no usamos autenticación, permitimos acceso público anónimo para leer y escribir.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a levels" ON public.levels FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a achievements" ON public.achievements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a global_stats" ON public.global_stats FOR ALL USING (true) WITH CHECK (true);

-- 3. INSERCIÓN DE DATOS BÁSICOS (SEED DATA)

-- Insertar Niveles
INSERT INTO public.levels (name, required_points, color) VALUES
('Bronce', 0, '#cd7f32'),
('Plata', 500, '#c0c0c0'),
('Oro', 1500, '#ffd700'),
('Platino', 3000, '#e5e4e2'),
('Diamante', 5000, '#b9f2ff');

-- Insertar Estadísticas Globales Iniciales
INSERT INTO public.global_stats (total_points, total_completed, last_activity_date, total_available_achievements)
VALUES (0, 0, NULL, 15);

-- Insertar Categorías y guardar sus IDs para los logros
DO $$
DECLARE
    cat_aventura UUID;
    cat_romance UUID;
    cat_gastronomia UUID;
    cat_relax UUID;
    cat_viajes UUID;
BEGIN
    INSERT INTO public.categories (name, icon, color) VALUES ('Aventura', 'explore', '#ef4444') RETURNING id INTO cat_aventura;
    INSERT INTO public.categories (name, icon, color) VALUES ('Romance', 'favorite', '#ec4899') RETURNING id INTO cat_romance;
    INSERT INTO public.categories (name, icon, color) VALUES ('Gastronomía', 'restaurant', '#f59e0b') RETURNING id INTO cat_gastronomia;
    INSERT INTO public.categories (name, icon, color) VALUES ('Relax', 'spa', '#10b981') RETURNING id INTO cat_relax;
    INSERT INTO public.categories (name, icon, color) VALUES ('Viajes', 'flight_takeoff', '#3b82f6') RETURNING id INTO cat_viajes;

    -- Logros de Aventura
    INSERT INTO public.achievements (category_id, title, description, points) VALUES
    (cat_aventura, 'Escalar una montaña', 'Llegar a la cima de una montaña o cerro juntos.', 300),
    (cat_aventura, 'Acampar bajo las estrellas', 'Pasar una noche en una tienda de campaña al aire libre.', 200),
    (cat_aventura, 'Parque de diversiones', 'Subirse a la montaña rusa más alta del parque.', 150);

    -- Logros de Romance
    INSERT INTO public.achievements (category_id, title, description, points) VALUES
    (cat_romance, 'Cena a la luz de las velas', 'Preparar y disfrutar una cena romántica en casa.', 100),
    (cat_romance, 'Recrear nuestra primera cita', 'Ir al mismo lugar y pedir lo mismo que la primera vez.', 250),
    (cat_romance, 'Maratón de películas', 'Ver una saga completa de películas abrazados todo el día.', 100);

    -- Logros de Gastronomía
    INSERT INTO public.achievements (category_id, title, description, points) VALUES
    (cat_gastronomia, 'Clase de cocina', 'Tomar una clase de cocina juntos o seguir un tutorial complejo en YouTube.', 200),
    (cat_gastronomia, 'Cena a ciegas', 'Uno de los dos cocina y el otro debe adivinar los ingredientes con los ojos vendados.', 150),
    (cat_gastronomia, 'Ruta del postre', 'Visitar 3 lugares diferentes en un solo día solo para comer postres.', 200);

    -- Logros de Relax
    INSERT INTO public.achievements (category_id, title, description, points) VALUES
    (cat_relax, 'Día de Spa en casa', 'Masajes, mascarillas y música relajante sin salir de casa.', 150),
    (cat_relax, 'Desconexión total', 'Pasar 24 horas sin usar teléfonos celulares ni redes sociales.', 300),
    (cat_relax, 'Desayuno en la cama', 'Sorprender al otro con un desayuno completo servido en la cama.', 100);

    -- Logros de Viajes
    INSERT INTO public.achievements (category_id, title, description, points) VALUES
    (cat_viajes, 'Viaje espontáneo', 'Ir a una ciudad cercana sin planearlo, empacando en 15 minutos.', 400),
    (cat_viajes, 'Sellar el pasaporte', 'Viajar juntos a un país extranjero.', 1000),
    (cat_viajes, 'Roadtrip sin GPS', 'Conducir hacia lo desconocido usando solo un mapa de papel o instinto.', 300);
END $$;
