-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE (CORREGIDO)
-- Borra todas las tablas existentes y las recrea
-- ==========================================

-- 1. ELIMINAR TODAS LAS TABLAS EXISTENTES (si existen)
DROP TRIGGER IF EXISTS trigger_update_global_stats ON public.achievements;
DROP FUNCTION IF EXISTS update_global_stats_on_achievement_complete();

DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.global_stats CASCADE;
DROP TABLE IF EXISTS public.levels CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- 2. CREACIÓN DE TABLAS

-- Tabla de Categorías
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    completed_count INTEGER DEFAULT 0
);

-- Tabla de Niveles (Dificultades de Logros)
CREATE TABLE public.levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    points INTEGER NOT NULL,
    color TEXT NOT NULL
);

-- Tabla de Logros
CREATE TABLE public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    level_id UUID REFERENCES public.levels(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
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

-- 3. CONFIGURACIÓN DE SEGURIDAD (Row Level Security - RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a levels" ON public.levels FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a achievements" ON public.achievements FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso público a global_stats" ON public.global_stats FOR ALL USING (true) WITH CHECK (true);

-- 4. INSERCIÓN DE DATOS BÁSICOS

-- Insertar Niveles (Dificultades de Logros)
INSERT INTO public.levels (name, points, color) VALUES
('Bronce', 50, '#cd7f32'),
('Plata', 100, '#c0c0c0'),
('Oro', 200, '#ffd700'),
('Platino', 300, '#e5e4e2');

-- Insertar Estadísticas Globales Iniciales
INSERT INTO public.global_stats (total_points, total_completed, last_activity_date, total_available_achievements)
VALUES (0, 0, NULL, 15);

-- 5. TRIGGERS PARA ACTUALIZAR GLOBAL_STATS
CREATE OR REPLACE FUNCTION update_global_stats_on_achievement_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_completed = true AND OLD.is_completed = false THEN
        -- Sumar puntos y actualizar contador de completados
        UPDATE public.global_stats 
        SET 
            total_points = total_points + (SELECT points FROM public.levels WHERE id = NEW.level_id),
            total_completed = total_completed + 1,
            last_activity_date = NOW()
        WHERE id = (SELECT id FROM public.global_stats LIMIT 1);
        
        -- Incrementar completed_count en la categoría
        UPDATE public.categories 
        SET completed_count = completed_count + 1 
        WHERE id = NEW.category_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_global_stats
AFTER UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION update_global_stats_on_achievement_complete();

-- 6. INSERCIÓN DE CATEGORÍAS Y LOGROS
DO $$
DECLARE
    cat_aventura UUID;
    cat_romance UUID;
    cat_gastronomia UUID;
    cat_relax UUID;
    cat_viajes UUID;
    
    level_bronce UUID;
    level_plata UUID;
    level_oro UUID;
    level_platino UUID;
BEGIN
    -- Obtener IDs de niveles
    SELECT id INTO level_bronce FROM public.levels WHERE name = 'Bronce';
    SELECT id INTO level_plata FROM public.levels WHERE name = 'Plata';
    SELECT id INTO level_oro FROM public.levels WHERE name = 'Oro';
    SELECT id INTO level_platino FROM public.levels WHERE name = 'Platino';

    -- Insertar Categorías
    INSERT INTO public.categories (name, icon, color) VALUES ('Aventura', 'explore', '#ef4444') RETURNING id INTO cat_aventura;
    INSERT INTO public.categories (name, icon, color) VALUES ('Romance', 'favorite', '#ec4899') RETURNING id INTO cat_romance;
    INSERT INTO public.categories (name, icon, color) VALUES ('Gastronomía', 'restaurant', '#f59e0b') RETURNING id INTO cat_gastronomia;
    INSERT INTO public.categories (name, icon, color) VALUES ('Relax', 'spa', '#10b981') RETURNING id INTO cat_relax;
    INSERT INTO public.categories (name, icon, color) VALUES ('Viajes', 'flight_takeoff', '#3b82f6') RETURNING id INTO cat_viajes;

    -- Logros de Aventura
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    (cat_aventura, level_platino, 'Escalar una montaña', 'Llegar a la cima de una montaña o cerro juntos.', 'https://via.placeholder.com/300?text=Montaña'),
    (cat_aventura, level_plata, 'Acampar bajo las estrellas', 'Pasar una noche en una tienda de campaña al aire libre.', 'https://via.placeholder.com/300?text=Campamento'),
    (cat_aventura, level_bronce, 'Parque de diversiones', 'Subirse a la montaña rusa más alta del parque.', 'https://via.placeholder.com/300?text=Montaña+Rusa');

    -- Logros de Romance
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    (cat_romance, level_bronce, 'Cena a la luz de las velas', 'Preparar y disfrutar una cena romántica en casa.', 'https://via.placeholder.com/300?text=Cena'),
    (cat_romance, level_oro, 'Recrear nuestra primera cita', 'Ir al mismo lugar y pedir lo mismo que la primera vez.', 'https://via.placeholder.com/300?text=Primera+Cita'),
    (cat_romance, level_bronce, 'Maratón de películas', 'Ver una saga completa de películas abrazados todo el día.', 'https://via.placeholder.com/300?text=Películas');

    -- Logros de Gastronomía
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    (cat_gastronomia, level_plata, 'Clase de cocina', 'Tomar una clase de cocina juntos o seguir un tutorial complejo.', 'https://via.placeholder.com/300?text=Cocina'),
    (cat_gastronomia, level_bronce, 'Cena a ciegas', 'Uno cocina y el otro adivina ingredientes con ojos vendados.', 'https://via.placeholder.com/300?text=Cena+Ciega'),
    (cat_gastronomia, level_plata, 'Ruta del postre', 'Visitar 3 lugares diferentes en un solo día solo para postres.', 'https://via.placeholder.com/300?text=Postres');

    -- Logros de Relax
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    (cat_relax, level_bronce, 'Día de Spa en casa', 'Masajes, mascarillas y música relajante sin salir de casa.', 'https://via.placeholder.com/300?text=Spa'),
    (cat_relax, level_oro, 'Desconexión total', 'Pasar 24 horas sin usar teléfonos ni redes sociales.', 'https://via.placeholder.com/300?text=Desconexión'),
    (cat_relax, level_bronce, 'Desayuno en la cama', 'Sorprender al otro con un desayuno completo en la cama.', 'https://via.placeholder.com/300?text=Desayuno');

    -- Logros de Viajes
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    (cat_viajes, level_platino, 'Viaje espontáneo', 'Ir a una ciudad cercana sin planearlo, empacando en 15 minutos.', 'https://via.placeholder.com/300?text=Viaje'),
    (cat_viajes, level_platino, 'Sellar el pasaporte', 'Viajar juntos a un país extranjero.', 'https://via.placeholder.com/300?text=Pasaporte'),
    (cat_viajes, level_oro, 'Roadtrip sin GPS', 'Conducir hacia lo desconocido usando solo un mapa de papel.', 'https://via.placeholder.com/300?text=Roadtrip');
END $$;
