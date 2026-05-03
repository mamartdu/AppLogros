-- ==========================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE (CON DATOS CSV)
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

-- Insertar Estadísticas Globales Iniciales (Se actualizará el total al final)
INSERT INTO public.global_stats (total_points, total_completed, last_activity_date, total_available_achievements)
VALUES (0, 0, NULL, 0);

-- 5. TRIGGERS PARA ACTUALIZAR GLOBAL_STATS (Añadir y Quitar puntos)
CREATE OR REPLACE FUNCTION update_global_stats_on_achievement_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso 1: El logro se MARCA como completado
    IF NEW.is_completed = true AND OLD.is_completed = false THEN
        UPDATE public.global_stats 
        SET 
            total_points = total_points + (SELECT points FROM public.levels WHERE id = NEW.level_id),
            total_completed = total_completed + 1,
            last_activity_date = NOW()
        WHERE id = (SELECT id FROM public.global_stats LIMIT 1);
        
        UPDATE public.categories 
        SET completed_count = completed_count + 1 
        WHERE id = NEW.category_id;

    -- Caso 2: El logro se DESMARCA (se vuelve a poner pendiente)
    ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
        UPDATE public.global_stats 
        SET 
            total_points = GREATEST(0, total_points - (SELECT points FROM public.levels WHERE id = NEW.level_id)),
            total_completed = GREATEST(0, total_completed - 1),
            last_activity_date = NOW()
        WHERE id = (SELECT id FROM public.global_stats LIMIT 1);
        
        UPDATE public.categories 
        SET completed_count = GREATEST(0, completed_count - 1) 
        WHERE id = NEW.category_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_global_stats
AFTER UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION update_global_stats_on_achievement_complete();

-- 6. INSERCIÓN DE CATEGORÍAS Y LOGROS DESDE EL CSV
DO $$
DECLARE
    cat_gastronomia UUID;
    cat_exploracion UUID;
    cat_mente_maestra UUID;
    cat_coleccionistas UUID;
    
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

    -- Insertar Categorías (He asignado colores e iconos que encajan con cada una)
    INSERT INTO public.categories (name, icon, color) VALUES ('Gastronomía', 'restaurant', '#f59e0b') RETURNING id INTO cat_gastronomia;
    INSERT INTO public.categories (name, icon, color) VALUES ('Exploración', 'explore', '#ef4444') RETURNING id INTO cat_exploracion;
    INSERT INTO public.categories (name, icon, color) VALUES ('Mente Maestra', 'psychology', '#8b5cf6') RETURNING id INTO cat_mente_maestra;
    INSERT INTO public.categories (name, icon, color) VALUES ('Coleccionistas', 'collections', '#10b981') RETURNING id INTO cat_coleccionistas;

    -- Logros
    INSERT INTO public.achievements (category_id, level_id, title, description, photo_url) VALUES
    -- Gastronomía
    (cat_gastronomia, level_bronce, 'Chef Pizzero', 'Preparar la masa y cenar pizza casera', NULL),
    (cat_gastronomia, level_plata, 'Ruta de los Elefantes', 'Visitar 10 bares diferentes de la Laurel', NULL),
    (cat_gastronomia, level_bronce, 'McFlurry con Baileys', 'Probar el mcFlurry con baileys (tiktok.com/@donjose/video/7560846899574574350)', NULL),
    (cat_gastronomia, level_oro, 'Cata de kebab', 'Probar todos los kebab de los supermecados', NULL),
    
    -- Exploración
    (cat_exploracion, level_plata, 'Despertar al León', 'Completar la ruta de senderismo del León Dormido', NULL),
    (cat_exploracion, level_oro, 'Bautismo Geocacher', 'Encontrar y firmar vuestro primer Geocache', NULL),

    -- Mente Maestra
    (cat_mente_maestra, level_oro, 'Sincronía Perfecta', 'Conseguir la puntuación máxima (25 puntos) en una partida de Hanabi', NULL),
    (cat_mente_maestra, level_oro, 'Paciencia de Titanio', 'Completar juntos un puzzle de 1000 piezas sin rendirse', NULL),

    -- Coleccionistas
    (cat_coleccionistas, level_platino, 'De la A a la Z', 'Completar 27 citas, cada una empezando por una letra del abecedario', NULL),
    (cat_coleccionistas, level_platino, 'Cazadores de Matrículas', 'Conseguir 10 fotos con combinaciones de números exactos (0000, 1111... 9999)', NULL),
    (cat_coleccionistas, level_oro, 'Las Cuatro Estaciones', 'Coleccionar 4 fotos juntos en el mismo sitio exacto (ej. Parque del Ebro), una en primavera, verano, otoño e invierno', NULL),
    (cat_coleccionistas, level_plata, 'Maratón de sofá', 'Empezar y terminar una temporada entera de una serie (o una miniserie) en un solo fin de semana', NULL);
    
    -- Actualizar el total de logros disponibles leyendo directamente cuántos hay insertados
    UPDATE public.global_stats SET total_available_achievements = (SELECT COUNT(*) FROM public.achievements);
END $$;