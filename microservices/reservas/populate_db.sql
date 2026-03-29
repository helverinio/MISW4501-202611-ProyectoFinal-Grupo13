-- Script SQL para popular las tablas de la base de datos de reservas
-- Tablase: paises, ciudades, estados, hoteles, habitaciones
-- 
-- Ejecutar con:
-- psql -U postgres -d reservas -f populate_db.sql
-- O dentro de psql:
-- \i populate_db.sql

-- Extensión para búsqueda sin tildes (requerida por buscar-disponibles)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 🗑️ Opcional: Limpiar antes de popular (comentar si ya hay datos que quieres mantener)
-- DELETE FROM habitaciones;
-- DELETE FROM hoteles;
-- DELETE FROM ciudades;
-- DELETE FROM paises;
-- DELETE FROM estados;

-- =============================================================================
-- PAISES
-- =============================================================================
INSERT INTO paises (id, nombre) VALUES
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Colombia'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'México'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0853', 'Brasil'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0854', 'Perú'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0855', 'Argentina')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CIUDADES
-- =============================================================================
INSERT INTO ciudades (id, nombre, id_pais) VALUES
  -- Colombia
  ('e290f1ee-6c54-4b01-90e6-d701748f0851', 'Bogotá', 'd290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0852', 'Medellín', 'd290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0853', 'Cartagena', 'd290f1ee-6c54-4b01-90e6-d701748f0851'),
  -- México
  ('e290f1ee-6c54-4b01-90e6-d701748f0854', 'CDMX', 'd290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0855', 'Cancún', 'd290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0856', 'Playa del Carmen', 'd290f1ee-6c54-4b01-90e6-d701748f0852'),
  -- Brasil
  ('e290f1ee-6c54-4b01-90e6-d701748f0857', 'São Paulo', 'd290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0858', 'Rio de Janeiro', 'd290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0859', 'Salvador', 'd290f1ee-6c54-4b01-90e6-d701748f0853'),
  -- Perú
  ('e290f1ee-6c54-4b01-90e6-d701748f0860', 'Lima', 'd290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0861', 'Cusco', 'd290f1ee-6c54-4b01-90e6-d701748f0854'),
  -- Argentina
  ('e290f1ee-6c54-4b01-90e6-d701748f0862', 'Buenos Aires', 'd290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('e290f1ee-6c54-4b01-90e6-d701748f0863', 'Mendoza', 'd290f1ee-6c54-4b01-90e6-d701748f0855')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- ESTADOS
-- =============================================================================
INSERT INTO estados (id, nombre, descripcion) VALUES
  ('f290f1ee-6c54-4b01-90e6-d701748f0851', 'Pendiente', 'La reserva ha sido creada pero aún no está confirmada'),
  ('f290f1ee-6c54-4b01-90e6-d701748f0852', 'Confirmada', 'La reserva ha sido confirmada y el pago ha sido procesado'),
  ('f290f1ee-6c54-4b01-90e6-d701748f0853', 'En proceso', 'La reserva está siendo procesada'),
  ('f290f1ee-6c54-4b01-90e6-d701748f0854', 'Completada', 'La estadía ha finalizado correctamente'),
  ('f290f1ee-6c54-4b01-90e6-d701748f0855', 'Cancelada', 'La reserva ha sido cancelada'),
  ('f290f1ee-6c54-4b01-90e6-d701748f0856', 'No-show', 'El huésped no se presentó en la fecha de inicio')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- HOTELES
-- =============================================================================
INSERT INTO hoteles (id, nombre, email, descripcion, amenidades, id_ciudad) VALUES
  -- Colombia
  ('a290f1ee-6c54-4b01-90e6-d701748f0851', 'Marriott Bogotá', 'reservas@marriott-bogota.com', 'Hotel de lujo en el corazón de Bogotá', 'WiFi gratis, Piscina, Spa, Restaurante, Gym', 'e290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0852', 'Hotel Éxito Medellín', 'info@exito-medellin.com', 'Hotel tres estrellas con excelente ubicación', 'WiFi, Bar, Desayuno incluido', 'e290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0853', 'Caribbean Hotel Cartagena', 'reservas@caribbean-cartagena.com', 'Resort frente al mar con vista al Caribe', 'Playa privada, Jacuzzi, All-inclusive', 'e290f1ee-6c54-4b01-90e6-d701748f0853'),
  -- México
  ('a290f1ee-6c54-4b01-90e6-d701748f0854', 'Grand Hotel CDMX', 'reservas@grandhotel-cdmx.com', 'Icónico hotel con vistas al Zócalo', 'Restaurante de clase mundial, Rooftop bar', 'e290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0855', 'Paradise Resort Cancún', 'info@paradise-cancun.com', 'Resort all-inclusive en la Riviera Maya', 'Playa privada, Piscinas ilimitadas, Entretenimiento', 'e290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0856', 'Beach Club Playa del Carmen', 'reservas@beachclub-playa.com', 'Hotel boutique frente a la playa', 'Acceso a playa, Snorkel, Spa', 'e290f1ee-6c54-4b01-90e6-d701748f0856'),
  -- Brasil
  ('a290f1ee-6c54-4b01-90e6-d701748f0857', 'Hotel Transamérica São Paulo', 'reservas@transamerica-sp.com', 'Rascacielos de cinco estrellas en el centro financiero', 'Vista panorámica, Business center, Premium restaurant', 'e290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0858', 'Copacabana Palace Rio', 'reservas@copacabana-rio.com', 'Legendario hotel en Copacabana Beach', 'Playa privada, Gym con vista al mar, Restaurante francés', 'e290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0859', 'Bahia Hotel Salvador', 'info@bahia-salvador.com', 'Hotel cultural con vista a la Bahía de Todos los Santos', 'Piscina, Restaurante bahiano, Tours culturales', 'e290f1ee-6c54-4b01-90e6-d701748f0859'),
  -- Perú
  ('a290f1ee-6c54-4b01-90e6-d701748f0860', 'Sheraton Lima', 'reservas@sheraton-lima.com', 'Hotel de negocios en Miraflores', 'Piscina, Spa, Business center', 'e290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0861', 'Sacred Valley Resort Cusco', 'info@sacredvalley-cusco.com', 'Resort en el corazón del Valle Sagrado', 'Tours a Machu Picchu, Restaurante andino, Spa ancestral', 'e290f1ee-6c54-4b01-90e6-d701748f0861'),
  -- Argentina
  ('a290f1ee-6c54-4b01-90e6-d701748f0862', 'Fierro Hotel Buenos Aires', 'reservas@fierro-ba.com', 'Hotel boutique en San Telmo', 'Biblioteca de arte, Rooftop bar, Desayuno gourmet', 'e290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('a290f1ee-6c54-4b01-90e6-d701748f0863', 'Park Hyatt Mendoza', 'info@parkhydi-mendoza.com', 'Resort cinco estrellas en la región vinícola', 'Tours de vinos, Spa termal, Viñedo en el terreno', 'e290f1ee-6c54-4b01-90e6-d701748f0863')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- HABITACIONES
-- =============================================================================
-- Para simplificar el script SQL, aquí se muestra cómo agregar habitaciones
-- para UN hotel (se repite para cada uno). Para llenar todos, ejecutar
-- el script Python que es más flexible.

-- Marriott Bogotá
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0851', 'Suite Deluxe', 100, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0852', 'Suite Deluxe', 101, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0853', 'Habitación Doble', 102, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0854', 'Habitación Doble', 103, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0855', 'Habitación Doble', 104, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0856', 'Habitación Triple', 105, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0857', 'Habitación Triple', 106, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0858', 'Habitación Triple', 107, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0859', 'Suite Presidencial', 108, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0860', 'Suite Presidencial', 109, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0861', 'Suite Presidencial', 110, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0862', 'Suite Presidencial', 111, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0863', 'Suite Presidencial', 112, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0864', 'Habitación Sencilla', 113, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0865', 'Habitación Sencilla', 114, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0851')
ON CONFLICT DO NOTHING;

-- NOTA: Para llenar TODAS las habitaciones de todos los hoteles de forma automática,
-- usa el script Python: python populate_db.py --clean
-- El script SQL aquí es solo una muestra. El script Python genera ~325 habitaciones automáticamente
-- (5 tipos de habitaciones × 5 unidades × 13 hoteles)

-- =============================================================================
-- Verificación
-- =============================================================================
SELECT 
  (SELECT COUNT(*) FROM paises) as total_paises,
  (SELECT COUNT(*) FROM ciudades) as total_ciudades,
  (SELECT COUNT(*) FROM estados) as total_estados,
  (SELECT COUNT(*) FROM hoteles) as total_hoteles,
  (SELECT COUNT(*) FROM habitaciones) as total_habitaciones;
