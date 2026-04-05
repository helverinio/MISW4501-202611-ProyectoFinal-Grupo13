import logging
from flask import request, jsonify
from datetime import datetime
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token

logger = logging.getLogger(__name__)
from app.application.use_cases import SearchAvailableHotelsUseCase
from app.application.use_cases.comentario_hotel_use_cases import RatingAggregationService
from app.application.use_cases.pricing_use_cases import PricingService
from app.infrastructure.repositories import (
    SQLAlchemyComentarioHotelRepository,
    SQLAlchemyHotelRepository,
    SQLAlchemyHabitacionRepository,
    SQLAlchemyCiudadRepository,
    SQLAlchemyPaisRepository,
    SQLAlchemyPricingRepository
)


def get_repositories():
    return (
        SQLAlchemyHotelRepository(),
        SQLAlchemyHabitacionRepository(),
        SQLAlchemyCiudadRepository(),
        SQLAlchemyPaisRepository()
    )


@api_v1_bp.route('/hoteles/buscar-disponibles', methods=['POST'])
@require_token
def search_available_hotels(current_usuario=None):
    """
    Busca hoteles disponibles con criterios de fecha y capacidad
    
    Request body:
    {
        "busqueda": "Bogota",  # Nombre de hotel o ciudad
        "fecha_ingreso": "2026-04-01",  # YYYY-MM-DD
        "fecha_salida": "2026-04-05",  # YYYY-MM-DD
        "nro_personas": 2
    }
    """
    logger.info("[buscar-disponibles] Solicitud recibida")
    data = request.get_json()
    logger.info("[buscar-disponibles] Body recibido: %s", data)
    if not data:
        logger.warning("[buscar-disponibles] Body vacío o Content-Type no es application/json")
        return jsonify({'error': 'No data provided'}), 400

    # Validar campos requeridos
    busqueda = data.get('busqueda', '').strip()
    fecha_ingreso_str = data.get('fecha_ingreso')
    fecha_salida_str = data.get('fecha_salida')
    nro_personas = data.get('nro_personas')

    logger.info("[buscar-disponibles] Params - busqueda='%s', fecha_ingreso='%s', fecha_salida='%s', nro_personas='%s'",
                 busqueda, fecha_ingreso_str, fecha_salida_str, nro_personas)
    if not busqueda or not fecha_ingreso_str or not fecha_salida_str or not nro_personas:
        logger.warning("[buscar-disponibles] Faltan campos requeridos - busqueda=%r, fecha_ingreso=%r, fecha_salida=%r, nro_personas=%r",
                       busqueda, fecha_ingreso_str, fecha_salida_str, nro_personas)
        return jsonify({
            'error': 'busqueda, fecha_ingreso, fecha_salida, and nro_personas are required'
        }), 400

    # Validar que nro_personas sea un número positivo
    try:
        nro_personas = int(nro_personas)
        if nro_personas < 1:
            raise ValueError("nro_personas debe ser mayor a 0")
    except (ValueError, TypeError):
        return jsonify({'error': 'nro_personas debe ser un número positivo'}), 400

    # Parsear fechas
    try:
        fecha_ingreso = datetime.strptime(fecha_ingreso_str, '%Y-%m-%d').date()
        fecha_salida = datetime.strptime(fecha_salida_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({
            'error': 'Fechas deben estar en formato YYYY-MM-DD'
        }), 400

    # Validar que la fecha de salida sea después de la de ingreso
    if fecha_salida <= fecha_ingreso:
        return jsonify({
            'error': 'fecha_salida debe ser posterior a fecha_ingreso'
        }), 400

    try:
        # Estados confirmados (para buscar reservas que conflictúen)
        confirmed_estado_nombres = ['Confirmada', 'Confirmado']
        logger.info("[buscar-disponibles] Estados confirmados a filtrar: %s", confirmed_estado_nombres)

        # Obtener repositories
        hotel_repo, habitacion_repo, ciudad_repo, pais_repo = get_repositories()

        # Ejecutar use case
        pricing_service = PricingService(SQLAlchemyPricingRepository())
        rating_aggregation_service = RatingAggregationService(SQLAlchemyComentarioHotelRepository())
        use_case = SearchAvailableHotelsUseCase(
            hotel_repo,
            habitacion_repo,
            ciudad_repo,
            pais_repo,
            pricing_service,
            rating_aggregation_service,
        )
        logger.info("[buscar-disponibles] Ejecutando use case...")
        resultados = use_case.execute(
            busqueda, fecha_ingreso, fecha_salida, nro_personas, confirmed_estado_nombres
        )
        logger.info("[buscar-disponibles] Use case retornó %d hoteles", len(resultados))

        # Formatear respuesta
        response = {
            'total_hoteles': len(resultados),
            'busqueda': busqueda,
            'fecha_ingreso': fecha_ingreso_str,
            'fecha_salida': fecha_salida_str,
            'nro_personas': nro_personas,
            'hoteles': [
                {
                    'hotel_id': r.hotel_id,
                    'nombre': r.nombre,
                    'descripcion': r.descripcion,
                    'amenidades': r.amenidades,
                    'email': r.email,
                    'ciudad': r.ciudad_nombre,
                    'pais': r.pais_nombre,
                    'rating_promedio': r.rating_promedio,
                    'cantidad_ratings': r.cantidad_ratings,
                    'cantidad_comentarios': r.cantidad_comentarios,
                    'total_habitaciones_disponibles': r.total_available_rooms,
                    'habitaciones': [
                        {
                            'habitacion_id': room.habitacion_id,
                            'tipo': room.tipo,
                            'nro_habitacion': room.nro_habitacion,
                            'capacidad': room.capacidad,
                            'camas': room.camas,
                            'moneda': room.moneda,
                            'precio_total_reserva': room.precio_total_reserva,
                            'precio_promedio_noche': room.precio_promedio_noche
                        }
                        for room in r.available_rooms
                    ]
                }
                for r in resultados
            ]
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': f'Error searching hotels: {str(e)}'}), 500
