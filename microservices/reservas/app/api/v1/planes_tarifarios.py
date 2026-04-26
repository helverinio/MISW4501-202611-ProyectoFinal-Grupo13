import uuid
from flask import request, jsonify
from app.api.v1 import api_v1_bp
from app.api.v1.auth import require_token
from app import db
from app.infrastructure.models.plan_tarifario_model import PlanTarifarioModel
from app.infrastructure.models.regla_tarifaria_model import ReglaTarifariaModel
from app.infrastructure.models.tipo_habitacion_model import TipoHabitacionModel


def _plan_dict(plan, include_reglas=False):
    d = {
        'id': plan.id,
        'nombre': plan.nombre,
        'descripcion': plan.descripcion,
        'moneda': plan.moneda,
        'activo': plan.activo,
        'id_tipo_habitacion': plan.id_tipo_habitacion,
    }
    if include_reglas:
        d['reglas'] = [_regla_dict(r) for r in plan.reglas_tarifarias if r.activo]
    return d


def _regla_dict(regla):
    return {
        'id': regla.id,
        'id_plan_tarifario': regla.id_plan_tarifario,
        'id_temporada': regla.id_temporada,
        'fecha_inicio': regla.fecha_inicio.isoformat() if regla.fecha_inicio else None,
        'fecha_fin': regla.fecha_fin.isoformat() if regla.fecha_fin else None,
        'dias_semana_mask': regla.dias_semana_mask,
        'precio_base_noche': regla.precio_base_noche,
        'prioridad': regla.prioridad,
        'min_noches': regla.min_noches,
        'combinable': regla.combinable,
        'activo': regla.activo,
    }


# ── Planes tarifarios ─────────────────────────────────────────────────────────

@api_v1_bp.route('/tipos-habitacion/<tipo_id>/planes-tarifarios', methods=['GET'])
@require_token
def get_planes_by_tipo(tipo_id, current_usuario=None):
    tipo = TipoHabitacionModel.query.get(tipo_id)
    if not tipo:
        return jsonify({'error': 'Tipo habitacion not found'}), 404

    include_reglas = request.args.get('include_reglas', 'false').lower() == 'true'
    planes = PlanTarifarioModel.query.filter_by(id_tipo_habitacion=tipo_id).all()
    return jsonify([_plan_dict(p, include_reglas=include_reglas) for p in planes])


@api_v1_bp.route('/tipos-habitacion/<tipo_id>/planes-tarifarios', methods=['POST'])
@require_token
def create_plan_tarifario(tipo_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    tipo = TipoHabitacionModel.query.get(tipo_id)
    if not tipo:
        return jsonify({'error': 'Tipo habitacion not found'}), 404

    data = request.get_json() or {}
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({'error': 'nombre is required'}), 400

    plan = PlanTarifarioModel(
        id=str(uuid.uuid4()),
        nombre=nombre,
        descripcion=data.get('descripcion'),
        moneda=data.get('moneda', 'USD'),
        activo=data.get('activo', True),
        id_tipo_habitacion=tipo_id,
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify(_plan_dict(plan)), 201


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['GET'])
@require_token
def get_plan_tarifario(plan_id, current_usuario=None):
    plan = PlanTarifarioModel.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404
    return jsonify(_plan_dict(plan, include_reglas=True))


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['PUT'])
@require_token
def update_plan_tarifario(plan_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    plan = PlanTarifarioModel.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    data = request.get_json() or {}
    if 'nombre' in data:
        plan.nombre = data['nombre']
    if 'descripcion' in data:
        plan.descripcion = data['descripcion']
    if 'moneda' in data:
        plan.moneda = data['moneda']
    if 'activo' in data:
        new_activo = bool(data['activo'])
        if not new_activo and plan.activo:
            active_count = PlanTarifarioModel.query.filter_by(
                id_tipo_habitacion=plan.id_tipo_habitacion, activo=True
            ).count()
            if active_count <= 1:
                return jsonify({
                    'error': 'No se puede desactivar el único plan activo del tipo de habitación. Agrega otro plan primero.'
                }), 409
        plan.activo = new_activo

    db.session.commit()
    return jsonify(_plan_dict(plan))


@api_v1_bp.route('/planes-tarifarios/<plan_id>', methods=['DELETE'])
@require_token
def delete_plan_tarifario(plan_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    plan = PlanTarifarioModel.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    if plan.activo:
        active_count = PlanTarifarioModel.query.filter_by(
            id_tipo_habitacion=plan.id_tipo_habitacion, activo=True
        ).count()
        if active_count <= 1:
            return jsonify({
                'error': 'No se puede eliminar el único plan activo del tipo de habitación. Agrega otro plan primero.'
            }), 409

    plan.activo = False
    db.session.commit()
    return jsonify({'message': 'Plan deactivated'}), 200


# ── Reglas tarifarias ─────────────────────────────────────────────────────────

@api_v1_bp.route('/planes-tarifarios/<plan_id>/reglas', methods=['GET'])
@require_token
def get_reglas_by_plan(plan_id, current_usuario=None):
    plan = PlanTarifarioModel.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    reglas = ReglaTarifariaModel.query.filter_by(id_plan_tarifario=plan_id, activo=True).all()
    return jsonify([_regla_dict(r) for r in reglas])


@api_v1_bp.route('/planes-tarifarios/<plan_id>/reglas', methods=['POST'])
@require_token
def create_regla_tarifaria(plan_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    plan = PlanTarifarioModel.query.get(plan_id)
    if not plan:
        return jsonify({'error': 'Plan not found'}), 404

    data = request.get_json() or {}
    precio = data.get('precio_base_noche')
    if precio is None:
        return jsonify({'error': 'precio_base_noche is required'}), 400
    if float(precio) <= 0:
        return jsonify({'error': 'precio_base_noche debe ser mayor a 0'}), 400

    from datetime import date
    def _parse_date(val):
        if val is None:
            return None
        return date.fromisoformat(val) if isinstance(val, str) else val

    regla = ReglaTarifariaModel(
        id=str(uuid.uuid4()),
        id_plan_tarifario=plan_id,
        id_temporada=data.get('id_temporada'),
        fecha_inicio=_parse_date(data.get('fecha_inicio')),
        fecha_fin=_parse_date(data.get('fecha_fin')),
        dias_semana_mask=data.get('dias_semana_mask'),
        precio_base_noche=float(precio),
        prioridad=int(data.get('prioridad', 0)),
        min_noches=data.get('min_noches'),
        combinable=bool(data.get('combinable', False)),
        activo=True,
    )
    db.session.add(regla)
    db.session.commit()
    return jsonify(_regla_dict(regla)), 201


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['GET'])
@require_token
def get_regla_tarifaria(regla_id, current_usuario=None):
    regla = ReglaTarifariaModel.query.get(regla_id)
    if not regla:
        return jsonify({'error': 'Regla not found'}), 404
    return jsonify(_regla_dict(regla))


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['PUT'])
@require_token
def update_regla_tarifaria(regla_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    regla = ReglaTarifariaModel.query.get(regla_id)
    if not regla:
        return jsonify({'error': 'Regla not found'}), 404

    from datetime import date
    def _parse_date(val):
        if val is None:
            return None
        return date.fromisoformat(val) if isinstance(val, str) else val

    data = request.get_json() or {}
    if 'precio_base_noche' in data:
        nuevo_precio = float(data['precio_base_noche'])
        if nuevo_precio <= 0:
            return jsonify({'error': 'precio_base_noche debe ser mayor a 0'}), 400
        regla.precio_base_noche = nuevo_precio
    if 'fecha_inicio' in data:
        regla.fecha_inicio = _parse_date(data['fecha_inicio'])
    if 'fecha_fin' in data:
        regla.fecha_fin = _parse_date(data['fecha_fin'])
    if 'dias_semana_mask' in data:
        regla.dias_semana_mask = data['dias_semana_mask']
    if 'prioridad' in data:
        regla.prioridad = int(data['prioridad'])
    if 'min_noches' in data:
        regla.min_noches = data['min_noches']
    if 'combinable' in data:
        regla.combinable = bool(data['combinable'])
    if 'activo' in data:
        new_activo = bool(data['activo'])
        if not new_activo and regla.activo:
            active_count = ReglaTarifariaModel.query.filter_by(
                id_plan_tarifario=regla.id_plan_tarifario, activo=True
            ).count()
            if active_count <= 1:
                return jsonify({
                    'error': 'No se puede desactivar la única regla activa del plan. Agrega otra regla primero.'
                }), 409
        regla.activo = new_activo
    if 'id_temporada' in data:
        regla.id_temporada = data['id_temporada']

    db.session.commit()
    return jsonify(_regla_dict(regla))


@api_v1_bp.route('/reglas-tarifarias/<regla_id>', methods=['DELETE'])
@require_token
def delete_regla_tarifaria(regla_id, current_usuario=None):
    if not current_usuario or current_usuario.get('role') != 'ADMIN':
        return jsonify({'error': 'Admin role required'}), 403

    regla = ReglaTarifariaModel.query.get(regla_id)
    if not regla:
        return jsonify({'error': 'Regla not found'}), 404

    if regla.activo:
        active_count = ReglaTarifariaModel.query.filter_by(
            id_plan_tarifario=regla.id_plan_tarifario, activo=True
        ).count()
        if active_count <= 1:
            return jsonify({
                'error': 'No se puede eliminar la única regla activa del plan. Agrega otra regla primero.'
            }), 409

    regla.activo = False
    db.session.commit()
    return jsonify({'message': 'Regla deactivated'}), 200
