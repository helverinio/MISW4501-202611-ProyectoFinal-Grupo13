from flask import Blueprint

api_v1_bp = Blueprint('api_v1', __name__)

from app.api.v1 import paises
from app.api.v1 import ciudades
from app.api.v1 import hoteles
from app.api.v1 import buscar_hoteles
from app.api.v1 import habitaciones
from app.api.v1 import tarifas
from app.api.v1 import estados
from app.api.v1 import reservas
from app.api.v1 import pagos
from app.api.v1 import notificaciones
from app.api.v1 import room_holds
from app.api.v1 import cotizaciones
