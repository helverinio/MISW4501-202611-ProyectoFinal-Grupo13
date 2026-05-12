import requests
from typing import Dict, Any
from flask import has_request_context, request


class ReservasService:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def _forward_headers(self) -> Dict[str, str]:
        headers = {}
        if has_request_context():
            authorization = request.headers.get('Authorization')
            if authorization:
                headers['Authorization'] = authorization
            forwarded_for = request.headers.get('X-Forwarded-For') or request.remote_addr
            if forwarded_for:
                headers['X-Forwarded-For'] = forwarded_for
            request_id = request.headers.get('X-Request-Id')
            if request_id:
                headers['X-Request-Id'] = request_id
        return headers

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Dict[str, Any] = None,
        params: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/{endpoint}"
            headers = self._forward_headers()
            if method == 'GET':
                if params is None:
                    response = requests.get(url, headers=headers, timeout=30)
                else:
                    response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return {'status_code': 400, 'data': {'error': 'Invalid method'}}
            return {'status_code': response.status_code, 'data': response.json()}
        except requests.RequestException as e:
            return {'status_code': 500, 'data': {'error': str(e)}}

    # Paises
    def create_pais(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'paises', data)

    def get_pais(self, pais_id: str) -> Dict[str, Any]:
        return self._request('GET', f'paises/{pais_id}')

    def get_all_paises(self) -> Dict[str, Any]:
        return self._request('GET', 'paises')

    def update_pais(self, pais_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'paises/{pais_id}', data)

    def delete_pais(self, pais_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'paises/{pais_id}')

    def get_ciudades_by_pais(self, pais_id: str) -> Dict[str, Any]:
        return self._request('GET', f'paises/{pais_id}/ciudades')

    # Ciudades
    def create_ciudad(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'ciudades', data)

    def get_ciudad(self, ciudad_id: str) -> Dict[str, Any]:
        return self._request('GET', f'ciudades/{ciudad_id}')

    def get_all_ciudades(self) -> Dict[str, Any]:
        return self._request('GET', 'ciudades')

    def update_ciudad(self, ciudad_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'ciudades/{ciudad_id}', data)

    def delete_ciudad(self, ciudad_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'ciudades/{ciudad_id}')

    def get_hoteles_by_ciudad(self, ciudad_id: str) -> Dict[str, Any]:
        return self._request('GET', f'ciudades/{ciudad_id}/hoteles')

    # Hoteles
    def create_hotel(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'hoteles', data)

    def get_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('GET', f'hoteles/{hotel_id}')

    def get_all_hoteles(self) -> Dict[str, Any]:
        return self._request('GET', 'hoteles')

    def update_hotel(self, hotel_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'hoteles/{hotel_id}', data)

    def delete_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'hoteles/{hotel_id}')

    def get_habitaciones_by_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('GET', f'hoteles/{hotel_id}/habitaciones')

    def search_available_hotels(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'hoteles/buscar-disponibles', data)

    def get_popular_destinations_by_city(self, limit: int = 4) -> Dict[str, Any]:
        return self._request(
            'GET',
            'hoteles/populares-por-ciudad',
            params={'limit': limit},
        )

    def get_hotel_comments(
        self,
        hotel_id: str,
        page: int = 1,
        per_page: int = 10,
    ) -> Dict[str, Any]:
        return self._request(
            'GET',
            f'hoteles/{hotel_id}/comentarios',
            params={'page': page, 'per_page': per_page},
        )

    def create_hotel_comment(self, hotel_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'hoteles/{hotel_id}/comentarios', data)

    def get_hotel_rating(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('GET', f'hoteles/{hotel_id}/rating')

    # Habitaciones
    def create_habitacion(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'habitaciones', data)

    def get_habitacion(self, habitacion_id: str) -> Dict[str, Any]:
        return self._request('GET', f'habitaciones/{habitacion_id}')

    def get_all_habitaciones(self) -> Dict[str, Any]:
        return self._request('GET', 'habitaciones')

    def update_habitacion(self, habitacion_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'habitaciones/{habitacion_id}', data)

    def delete_habitacion(self, habitacion_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'habitaciones/{habitacion_id}')

    def get_habitaciones_by_tipo(self, tipo_id: str) -> Dict[str, Any]:
        return self._request('GET', f'tipos-habitacion/{tipo_id}/habitaciones')

    def get_tarifas_by_habitacion(self, habitacion_id: str) -> Dict[str, Any]:
        return self._request('GET', f'habitaciones/{habitacion_id}/tarifas')

    def get_reservas_by_habitacion(self, habitacion_id: str) -> Dict[str, Any]:
        return self._request('GET', f'habitaciones/{habitacion_id}/reservas')

    # Room Holds
    def acquire_room_hold(self, habitacion_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'habitaciones/{habitacion_id}/hold', data)

    def check_room_hold(self, habitacion_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'habitaciones/{habitacion_id}/hold/check', data)

    def get_hold(self, hold_id: str) -> Dict[str, Any]:
        return self._request('GET', f'holds/{hold_id}')

    def release_hold(self, hold_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'holds/{hold_id}')

    def cleanup_expired_holds(self) -> Dict[str, Any]:
        return self._request('POST', 'holds/cleanup')

    # Tarifas
    def create_tarifa(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'tarifas', data)

    def get_tarifa(self, tarifa_id: str) -> Dict[str, Any]:
        return self._request('GET', f'tarifas/{tarifa_id}')

    def get_all_tarifas(self) -> Dict[str, Any]:
        return self._request('GET', 'tarifas')

    def update_tarifa(self, tarifa_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'tarifas/{tarifa_id}', data)

    def delete_tarifa(self, tarifa_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'tarifas/{tarifa_id}')

    # Estados
    def create_estado(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'estados', data)

    def get_estado(self, estado_id: str) -> Dict[str, Any]:
        return self._request('GET', f'estados/{estado_id}')

    def get_all_estados(self) -> Dict[str, Any]:
        return self._request('GET', 'estados')

    def update_estado(self, estado_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'estados/{estado_id}', data)

    def delete_estado(self, estado_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'estados/{estado_id}')

    # Reservas
    def create_reserva(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'reservas', data)

    def get_reserva(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('GET', f'reservas/{reserva_id}')

    def get_all_reservas(self) -> Dict[str, Any]:
        return self._request('GET', 'reservas')

    def update_reserva(self, reserva_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'reservas/{reserva_id}', data)

    def delete_reserva(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'reservas/{reserva_id}')

    def get_reservas_by_usuario(self, usuario_id: str) -> Dict[str, Any]:
        return self._request('GET', f'usuarios/{usuario_id}/reservas')


    def get_recently_viewed_by_usuario(self, usuario_id: str, limit: int = 3) -> Dict[str, Any]:
        return self._request(
            'GET',
            f'usuarios/{usuario_id}/reservas/recently-viewed',
            params={'limit': limit},
        )

    def generate_checkin_qr(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('GET', f'reservas/{reserva_id}/checkin-qr')

    def checkin_reserva(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('POST', f'reservas/{reserva_id}/checkin')

    def create_reserva_pms_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'reservas/webhook/pms', data)

    def get_pagos_by_reserva(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('GET', f'reservas/{reserva_id}/pagos')

    def get_notificaciones_by_reserva(self, reserva_id: str, tipo: str = None) -> Dict[str, Any]:
        params = {'tipo': tipo} if tipo else None
        return self._request('GET', f'reservas/{reserva_id}/notificaciones', params=params)

    # Pagos
    def create_pago(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'pagos', data)

    def get_pago(self, pago_id: str) -> Dict[str, Any]:
        return self._request('GET', f'pagos/{pago_id}')

    def get_all_pagos(self) -> Dict[str, Any]:
        return self._request('GET', 'pagos')

    def update_pago(self, pago_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'pagos/{pago_id}', data)

    def delete_pago(self, pago_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'pagos/{pago_id}')

    # Notificaciones
    def create_notificacion(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'notificaciones', data)

    def get_notificacion(self, notificacion_id: str) -> Dict[str, Any]:
        return self._request('GET', f'notificaciones/{notificacion_id}')

    def get_all_notificaciones(self) -> Dict[str, Any]:
        return self._request('GET', 'notificaciones')

    def update_notificacion(self, notificacion_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'notificaciones/{notificacion_id}', data)

    def delete_notificacion(self, notificacion_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'notificaciones/{notificacion_id}')

    def payment_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'payments/webhook', data)

    # Admin-Hotel assignment
    def get_mis_hoteles(self) -> Dict[str, Any]:
        return self._request('GET', 'admin/mis-hoteles')

    def asignar_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('POST', f'admin/hoteles/{hotel_id}/asignar')

    def desasignar_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'admin/hoteles/{hotel_id}/desasignar')

    def get_admin_reservas_dashboard(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        return self._request('GET', 'admin/reservas/dashboard', params=params)

    def get_admin_revenue_report(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        return self._request('GET', 'admin/revenue-report', params=params)

    def get_admin_reserva_detail(self, reserva_id: str) -> Dict[str, Any]:
        return self._request('GET', f'admin/reservas/{reserva_id}')

    def update_reserva_estado(self, reserva_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'admin/reservas/{reserva_id}/estado', data)

    def get_admin_reviews(self, params: Dict[str, Any] = None) -> Dict[str, Any]:
        return self._request('GET', 'admin/reviews', params=params)

    # Tipos habitacion
    def get_tipos_habitacion_by_hotel(self, hotel_id: str) -> Dict[str, Any]:
        return self._request('GET', f'hoteles/{hotel_id}/tipos-habitacion')

    def create_tipo_habitacion(self, hotel_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'hoteles/{hotel_id}/tipos-habitacion', data)

    def get_tipo_habitacion(self, tipo_id: str) -> Dict[str, Any]:
        return self._request('GET', f'tipos-habitacion/{tipo_id}')

    def update_tipo_habitacion(self, tipo_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'tipos-habitacion/{tipo_id}', data)

    def delete_tipo_habitacion(self, tipo_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'tipos-habitacion/{tipo_id}')

    # Planes tarifarios
    def get_planes_by_tipo(self, tipo_id: str) -> Dict[str, Any]:
        return self._request('GET', f'tipos-habitacion/{tipo_id}/planes-tarifarios')

    def create_plan_tarifario(self, tipo_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'tipos-habitacion/{tipo_id}/planes-tarifarios', data)

    def get_plan_tarifario(self, plan_id: str) -> Dict[str, Any]:
        return self._request('GET', f'planes-tarifarios/{plan_id}')

    def update_plan_tarifario(self, plan_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'planes-tarifarios/{plan_id}', data)

    def delete_plan_tarifario(self, plan_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'planes-tarifarios/{plan_id}')

    # Reglas tarifarias
    def get_reglas_by_plan(self, plan_id: str) -> Dict[str, Any]:
        return self._request('GET', f'planes-tarifarios/{plan_id}/reglas')

    def create_regla_tarifaria(self, plan_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', f'planes-tarifarios/{plan_id}/reglas', data)

    def get_regla_tarifaria(self, regla_id: str) -> Dict[str, Any]:
        return self._request('GET', f'reglas-tarifarias/{regla_id}')

    def update_regla_tarifaria(self, regla_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'reglas-tarifarias/{regla_id}', data)

    def delete_regla_tarifaria(self, regla_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'reglas-tarifarias/{regla_id}')

    # Device Tokens (Push Notifications)
    def get_device_tokens(self, user_id: str) -> Dict[str, Any]:
        return self._request('GET', f'device-tokens/{user_id}')

    def register_device_token(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'device-tokens', data)

    def unregister_device_token(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('DELETE', 'device-tokens', data)

    # Push Notifications
    def send_push_notification(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'push-notifications/send', data)

    def send_push_notification_to_reservation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'push-notifications/send-to-reservation', data)
