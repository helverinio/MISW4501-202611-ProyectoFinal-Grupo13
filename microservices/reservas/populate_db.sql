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
--DELETE FROM reserva_detalle_tarifa;
--DELETE FROM reglas_tarifarias;
--DELETE FROM planes_tarifarios;
--DELETE FROM tipos_habitacion;
--DELETE FROM room_holds;
--DELETE FROM comentarios_hoteles;
--DELETE FROM notificaciones;
--DELETE FROM reservas;
--DELETE FROM habitaciones;
--DELETE FROM hoteles;
--DELETE FROM ciudades;
--DELETE FROM paises;
--DELETE FROM estados;

-- =============================================================================
-- PAISES
-- =============================================================================
INSERT INTO paises (id, nombre) VALUES
  ('d290f1ee-6c54-4b01-90e6-d701748f0851', 'Colombia'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0852', 'México'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0853', 'Brasil'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0854', 'Perú'),
  ('d290f1ee-6c54-4b01-90e6-d701748f0855', 'Argentina')
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

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
  ('a290f1ee-6c54-4b01-90e6-d701748f0863', 'Park Hyatt Mendoza', 'info@parkhydi-mendoza.com', 'Resort cinco estrellas en la región vinícola', 'Tours de vinos, Spa termal, Viñedo en el terreno', 'e290f1ee-6c54-4b01-90e6-d701748f0863'),
  -- Segundo hotel por ciudad prioritaria
  -- Bogotá
  ('a290f1ee-6c54-4b01-90e6-d701748f0864', 'Hotel NH Collection Bogotá', 'reservas@nh-bogota.com', 'Hotel moderno en la Zona Rosa con excelentes conexiones', 'WiFi, Gym, Restaurante, Bar, Business center', 'e290f1ee-6c54-4b01-90e6-d701748f0851'),
  -- Medellín
  ('a290f1ee-6c54-4b01-90e6-d701748f0865', 'El Poblado Park Hotel Medellín', 'info@poblado-park.com', 'Hotel boutique en el exclusivo barrio El Poblado', 'Piscina, Spa, Restaurante gourmet, Terraza', 'e290f1ee-6c54-4b01-90e6-d701748f0852'),
  -- Cartagena
  ('a290f1ee-6c54-4b01-90e6-d701748f0866', 'Hotel Santa Clara Cartagena', 'reservas@santa-clara-cartagena.com', 'Hotel de lujo en convento colonial del siglo XVII', 'Piscina, Restaurante de alta cocina, Spa, Patio colonial', 'e290f1ee-6c54-4b01-90e6-d701748f0853'),
  -- Cancún
  ('a290f1ee-6c54-4b01-90e6-d701748f0867', 'Moon Palace Cancún', 'reservas@moon-palace-cancun.com', 'All-inclusive de lujo en la Zona Hotelera de Cancún', 'Playa, Piscinas, Entretenimiento, Múltiples restaurantes', 'e290f1ee-6c54-4b01-90e6-d701748f0855')
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

-- Hotel Éxito Medellín
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0866', 'Suite Deluxe', 201, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0867', 'Suite Deluxe', 202, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0868', 'Habitación Doble', 203, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0869', 'Habitación Doble', 204, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0870', 'Habitación Doble', 205, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0871', 'Habitación Triple', 206, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0872', 'Habitación Triple', 207, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0873', 'Suite Presidencial', 208, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0874', 'Habitación Sencilla', 209, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0875', 'Habitación Sencilla', 210, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0852')
ON CONFLICT (id) DO NOTHING;

-- Caribbean Hotel Cartagena
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0876', 'Suite Deluxe', 301, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0877', 'Suite Deluxe', 302, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0878', 'Habitación Doble', 303, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0879', 'Habitación Doble', 304, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0880', 'Habitación Doble', 305, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0881', 'Habitación Triple', 306, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0882', 'Habitación Triple', 307, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0883', 'Suite Presidencial', 308, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0884', 'Habitación Sencilla', 309, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0885', 'Habitación Sencilla', 310, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0853')
ON CONFLICT (id) DO NOTHING;

-- Grand Hotel CDMX
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0886', 'Suite Deluxe', 401, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0887', 'Suite Deluxe', 402, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0888', 'Habitación Doble', 403, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0889', 'Habitación Doble', 404, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0890', 'Habitación Doble', 405, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0891', 'Habitación Triple', 406, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0892', 'Habitación Triple', 407, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0893', 'Suite Presidencial', 408, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0894', 'Habitación Sencilla', 409, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0895', 'Habitación Sencilla', 410, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0854')
ON CONFLICT (id) DO NOTHING;

-- Paradise Resort Cancún
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0896', 'Suite Deluxe', 501, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0897', 'Suite Deluxe', 502, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0898', 'Habitación Doble', 503, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0899', 'Habitación Doble', 504, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0900', 'Habitación Doble', 505, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0901', 'Habitación Triple', 506, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0902', 'Habitación Triple', 507, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0903', 'Suite Presidencial', 508, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0904', 'Habitación Sencilla', 509, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0905', 'Habitación Sencilla', 510, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0855')
ON CONFLICT (id) DO NOTHING;

-- Beach Club Playa del Carmen
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0906', 'Suite Deluxe', 601, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0907', 'Suite Deluxe', 602, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0908', 'Habitación Doble', 603, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0909', 'Habitación Doble', 604, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0910', 'Habitación Doble', 605, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0911', 'Habitación Triple', 606, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0912', 'Habitación Triple', 607, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0913', 'Suite Presidencial', 608, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0914', 'Habitación Sencilla', 609, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0915', 'Habitación Sencilla', 610, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0856')
ON CONFLICT (id) DO NOTHING;

-- Hotel Transamérica São Paulo
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0916', 'Suite Deluxe', 701, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0917', 'Suite Deluxe', 702, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0918', 'Habitación Doble', 703, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0919', 'Habitación Doble', 704, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0920', 'Habitación Doble', 705, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0921', 'Habitación Triple', 706, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0922', 'Habitación Triple', 707, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0923', 'Suite Presidencial', 708, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0924', 'Habitación Sencilla', 709, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0925', 'Habitación Sencilla', 710, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0857')
ON CONFLICT (id) DO NOTHING;

-- Copacabana Palace Rio
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0926', 'Suite Deluxe', 801, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0927', 'Suite Deluxe', 802, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0928', 'Habitación Doble', 803, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0929', 'Habitación Doble', 804, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0930', 'Habitación Doble', 805, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0931', 'Habitación Triple', 806, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0932', 'Habitación Triple', 807, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0933', 'Suite Presidencial', 808, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0934', 'Habitación Sencilla', 809, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0935', 'Habitación Sencilla', 810, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0858')
ON CONFLICT (id) DO NOTHING;

-- Bahia Hotel Salvador
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0936', 'Suite Deluxe', 901, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0937', 'Suite Deluxe', 902, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0938', 'Habitación Doble', 903, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0939', 'Habitación Doble', 904, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0940', 'Habitación Doble', 905, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0941', 'Habitación Triple', 906, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0942', 'Habitación Triple', 907, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0943', 'Suite Presidencial', 908, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0944', 'Habitación Sencilla', 909, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0945', 'Habitación Sencilla', 910, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0859')
ON CONFLICT (id) DO NOTHING;

-- Sheraton Lima
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0946', 'Suite Deluxe', 1001, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0947', 'Suite Deluxe', 1002, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0948', 'Habitación Doble', 1003, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0949', 'Habitación Doble', 1004, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0950', 'Habitación Doble', 1005, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0951', 'Habitación Triple', 1006, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0952', 'Habitación Triple', 1007, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0953', 'Suite Presidencial', 1008, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0954', 'Habitación Sencilla', 1009, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0955', 'Habitación Sencilla', 1010, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0860')
ON CONFLICT (id) DO NOTHING;

-- Sacred Valley Resort Cusco
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0956', 'Suite Deluxe', 1101, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0957', 'Suite Deluxe', 1102, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0958', 'Habitación Doble', 1103, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0959', 'Habitación Doble', 1104, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0960', 'Habitación Doble', 1105, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0961', 'Habitación Triple', 1106, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0962', 'Habitación Triple', 1107, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0963', 'Suite Presidencial', 1108, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0964', 'Habitación Sencilla', 1109, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0965', 'Habitación Sencilla', 1110, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0861')
ON CONFLICT (id) DO NOTHING;

-- Fierro Hotel Buenos Aires
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0966', 'Suite Deluxe', 1201, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0967', 'Suite Deluxe', 1202, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0968', 'Habitación Doble', 1203, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0969', 'Habitación Doble', 1204, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0970', 'Habitación Doble', 1205, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0971', 'Habitación Triple', 1206, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0972', 'Habitación Triple', 1207, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0973', 'Suite Presidencial', 1208, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0974', 'Habitación Sencilla', 1209, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0975', 'Habitación Sencilla', 1210, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0862')
ON CONFLICT (id) DO NOTHING;

-- Park Hyatt Mendoza
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0976', 'Suite Deluxe', 1301, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0977', 'Suite Deluxe', 1302, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0978', 'Habitación Doble', 1303, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0979', 'Habitación Doble', 1304, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0980', 'Habitación Doble', 1305, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0981', 'Habitación Triple', 1306, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0982', 'Habitación Triple', 1307, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0983', 'Suite Presidencial', 1308, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0984', 'Habitación Sencilla', 1309, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0985', 'Habitación Sencilla', 1310, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0863')
ON CONFLICT (id) DO NOTHING;

-- Hotel NH Collection Bogotá (segundo hotel en Bogotá)
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0986', 'Suite Deluxe', 1401, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0987', 'Suite Deluxe', 1402, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0988', 'Habitación Doble', 1403, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0989', 'Habitación Doble', 1404, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0990', 'Habitación Doble', 1405, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0991', 'Habitación Triple', 1406, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0992', 'Habitación Triple', 1407, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0993', 'Suite Presidencial', 1408, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0994', 'Habitación Sencilla', 1409, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0995', 'Habitación Sencilla', 1410, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0864')
ON CONFLICT (id) DO NOTHING;

-- El Poblado Park Hotel Medellín (segundo hotel en Medellín)
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f0996', 'Suite Deluxe', 1501, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0997', 'Suite Deluxe', 1502, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0998', 'Habitación Doble', 1503, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f0999', 'Habitación Doble', 1504, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1000', 'Habitación Doble', 1505, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1001', 'Habitación Triple', 1506, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1002', 'Habitación Triple', 1507, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1003', 'Suite Presidencial', 1508, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1004', 'Habitación Sencilla', 1509, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1005', 'Habitación Sencilla', 1510, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0865')
ON CONFLICT (id) DO NOTHING;

-- Hotel Santa Clara Cartagena (segundo hotel en Cartagena)
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f1006', 'Suite Deluxe', 1601, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1007', 'Suite Deluxe', 1602, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1008', 'Habitación Doble', 1603, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1009', 'Habitación Doble', 1604, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1010', 'Habitación Doble', 1605, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1011', 'Habitación Triple', 1606, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1012', 'Habitación Triple', 1607, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1013', 'Suite Presidencial', 1608, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1014', 'Habitación Sencilla', 1609, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1015', 'Habitación Sencilla', 1610, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0866')
ON CONFLICT (id) DO NOTHING;

-- Moon Palace Cancún (segundo hotel en Cancún)
INSERT INTO habitaciones (id, tipo, nro_habitacion, capacidad, camas, id_hotel) VALUES
  ('b290f1ee-6c54-4b01-90e6-d701748f1016', 'Suite Deluxe', 1701, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1017', 'Suite Deluxe', 1702, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1018', 'Habitación Doble', 1703, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1019', 'Habitación Doble', 1704, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1020', 'Habitación Doble', 1705, 2, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1021', 'Habitación Triple', 1706, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1022', 'Habitación Triple', 1707, 3, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1023', 'Suite Presidencial', 1708, 4, 2, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1024', 'Habitación Sencilla', 1709, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867'),
  ('b290f1ee-6c54-4b01-90e6-d701748f1025', 'Habitación Sencilla', 1710, 1, 1, 'a290f1ee-6c54-4b01-90e6-d701748f0867')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- PRICING ENGINE (USD)
-- =============================================================================
INSERT INTO tipos_habitacion (id, nombre, descripcion, capacidad, camas, id_hotel, created_at, updated_at)
SELECT
  md5(h.id || '-' || hb.tipo) AS id,
  hb.tipo AS nombre,
  CONCAT('Tipo autogenerado para ', hb.tipo) AS descripcion,
  MAX(hb.capacidad) AS capacidad,
  MAX(hb.camas) AS camas,
  h.id AS id_hotel,
  NOW(),
  NOW()
FROM hoteles h
JOIN habitaciones hb ON hb.id_hotel = h.id
GROUP BY h.id, hb.tipo
ON CONFLICT (id) DO NOTHING;

UPDATE habitaciones hb
SET id_tipo_habitacion = t.id
FROM tipos_habitacion t
WHERE hb.id_hotel = t.id_hotel
  AND hb.tipo = t.nombre
  AND hb.id_tipo_habitacion IS NULL;

INSERT INTO planes_tarifarios (id, nombre, descripcion, moneda, activo, id_tipo_habitacion)
SELECT
  md5('plan-flex-' || t.id) AS id,
  'Flexible USD' AS nombre,
  'Plan flexible en USD' AS descripcion,
  'USD' AS moneda,
  TRUE AS activo,
  t.id AS id_tipo_habitacion
FROM tipos_habitacion t
ON CONFLICT (id) DO NOTHING;

INSERT INTO reglas_tarifarias (
  id, id_plan_tarifario, id_temporada, fecha_inicio, fecha_fin,
  dias_semana_mask, precio_base_noche, prioridad, min_noches, combinable, activo
)
SELECT
  md5('rule-base-' || p.id) AS id,
  p.id AS id_plan_tarifario,
  NULL,
  NULL,
  NULL,
  NULL,
  CASE
    WHEN t.capacidad >= 4 THEN 260.00
    WHEN t.capacidad = 3 THEN 180.00
    WHEN t.capacidad = 2 THEN 140.00
    ELSE 100.00
  END AS precio_base_noche,
  1,
  NULL,
  FALSE,
  TRUE
FROM planes_tarifarios p
JOIN tipos_habitacion t ON t.id = p.id_tipo_habitacion
ON CONFLICT (id) DO NOTHING;

INSERT INTO temporadas (id, nombre, descripcion, activo)
VALUES (md5('season-high-2026'), 'Temporada Alta 2026', 'Temporada alta de referencia', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO temporadas_detalle (id, id_temporada, fecha_inicio, fecha_fin)
VALUES (
  md5('season-high-2026-detail-1'),
  md5('season-high-2026'),
  '2026-03-29',
  '2026-04-05'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO reglas_tarifarias (
  id, id_plan_tarifario, id_temporada, fecha_inicio, fecha_fin,
  dias_semana_mask, precio_base_noche, prioridad, min_noches, combinable, activo
)
SELECT
  md5('rule-season-high-' || p.id) AS id,
  p.id AS id_plan_tarifario,
  md5('season-high-2026') AS id_temporada,
  '2026-03-29',
  '2026-04-05',
  NULL,
  CASE
    WHEN t.capacidad >= 4 THEN 320.00
    WHEN t.capacidad = 3 THEN 230.00
    WHEN t.capacidad = 2 THEN 185.00
    ELSE 130.00
  END AS precio_base_noche,
  100,
  NULL,
  FALSE,
  TRUE
FROM planes_tarifarios p
JOIN tipos_habitacion t ON t.id = p.id_tipo_habitacion
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- RESERVAS BASE (para habilitar reseñas)
-- =============================================================================
INSERT INTO reservas (
  id, fecha_ingreso, fecha_salida, total, nro_personas,
  id_usuario, id_pais, id_habitacion, id_estado, id_cotizacion
) VALUES
  (
    'c290f1ee-6c54-4b01-90e6-d701748f0851',
    '2026-03-20 15:00:00',
    '2026-03-23 11:00:00',
    420.00,
    2,
    'u290f1ee-6c54-4b01-90e6-d701748f0851',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'b290f1ee-6c54-4b01-90e6-d701748f0851',
    'f290f1ee-6c54-4b01-90e6-d701748f0854',
    NULL
  ),
  (
    'c290f1ee-6c54-4b01-90e6-d701748f0852',
    '2026-03-22 15:00:00',
    '2026-03-25 11:00:00',
    450.00,
    2,
    'u290f1ee-6c54-4b01-90e6-d701748f0852',
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'b290f1ee-6c54-4b01-90e6-d701748f0852',
    'f290f1ee-6c54-4b01-90e6-d701748f0854',
    NULL
  ),
  (
    'c290f1ee-6c54-4b01-90e6-d701748f0853',
    '2026-03-24 15:00:00',
    '2026-03-27 11:00:00',
    555.00,
    3,
    'u290f1ee-6c54-4b01-90e6-d701748f0853',
    'd290f1ee-6c54-4b01-90e6-d701748f0852',
    'b290f1ee-6c54-4b01-90e6-d701748f0864',
    'f290f1ee-6c54-4b01-90e6-d701748f0854',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- COMENTARIOS Y RATINGS DE HOTELES
-- =============================================================================
INSERT INTO comentarios_hoteles (
  id, id_hotel, id_usuario, id_reserva, comentario, rating, created_at, updated_at, activo
) VALUES
  (
    'g290f1ee-6c54-4b01-90e6-d701748f0851',
    'a290f1ee-6c54-4b01-90e6-d701748f0851',
    'u290f1ee-6c54-4b01-90e6-d701748f0851',
    'c290f1ee-6c54-4b01-90e6-d701748f0851',
    'Excelente ubicación y servicio del personal.',
    5,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    TRUE
  ),
  (
    'g290f1ee-6c54-4b01-90e6-d701748f0852',
    'a290f1ee-6c54-4b01-90e6-d701748f0851',
    'u290f1ee-6c54-4b01-90e6-d701748f0852',
    'c290f1ee-6c54-4b01-90e6-d701748f0852',
    'Habitación cómoda y desayuno muy completo.',
    4,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    TRUE
  ),
  (
    'g290f1ee-6c54-4b01-90e6-d701748f0853',
    'a290f1ee-6c54-4b01-90e6-d701748f0855',
    'u290f1ee-6c54-4b01-90e6-d701748f0853',
    'c290f1ee-6c54-4b01-90e6-d701748f0853',
    'Buena relación costo beneficio.',
    4,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    TRUE
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- Verificación
-- =============================================================================
SELECT 
  (SELECT COUNT(*) FROM paises) as total_paises,
  (SELECT COUNT(*) FROM ciudades) as total_ciudades,
  (SELECT COUNT(*) FROM estados) as total_estados,
  (SELECT COUNT(*) FROM hoteles) as total_hoteles,
  (SELECT COUNT(*) FROM habitaciones) as total_habitaciones,
  (SELECT COUNT(*) FROM tipos_habitacion) as total_tipos_habitacion,
  (SELECT COUNT(*) FROM planes_tarifarios) as total_planes_tarifarios,
  (SELECT COUNT(*) FROM reglas_tarifarias) as total_reglas_tarifarias,
  (SELECT COUNT(*) FROM reservas) as total_reservas,
  (SELECT COUNT(*) FROM comentarios_hoteles) as total_comentarios_hoteles;
