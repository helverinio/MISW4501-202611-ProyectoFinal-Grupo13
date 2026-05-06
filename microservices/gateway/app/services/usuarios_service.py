import requests
from typing import Dict, Any


class UsuariosService:
    def __init__(self, base_url: str):
        self.base_url = base_url

    def _request(self, method: str, endpoint: str, data: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/{endpoint}"
            request_headers = headers or {}
            if method == 'GET':
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                return {'status_code': 400, 'data': {'error': 'Invalid method'}}
            return {'status_code': response.status_code, 'data': response.json()}
        except requests.RequestException as e:
            return {'status_code': 500, 'data': {'error': str(e)}}

    # Usuarios CRUD
    def create_usuario(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'usuarios', data)

    def get_usuario(self, usuario_id: str) -> Dict[str, Any]:
        return self._request('GET', f'usuarios/{usuario_id}')

    def get_all_usuarios(self) -> Dict[str, Any]:
        return self._request('GET', 'usuarios')

    def update_usuario(self, usuario_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'usuarios/{usuario_id}', data)

    def delete_usuario(self, usuario_id: str) -> Dict[str, Any]:
        return self._request('DELETE', f'usuarios/{usuario_id}')

    # Authentication
    def login(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'auth/login', data)

    def verify_email(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'auth/verify-email', data)

    def refresh_token(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'auth/refresh', data)

    def get_current_user(self, authorization_header: str = None) -> Dict[str, Any]:
        headers = {'Authorization': authorization_header} if authorization_header else {}
        return self._request('GET', 'auth/me', headers=headers)

    def logout(self, authorization_header: str = None) -> Dict[str, Any]:
        headers = {'Authorization': authorization_header} if authorization_header else {}
        return self._request('POST', 'auth/logout', headers=headers)

    # Admin authentication with MFA
    def register_admin(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'admin/auth/register', data)

    def verify_admin_setup(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'admin/auth/verify-setup', data)

    def admin_login_step1(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'admin/auth/login/step1', data)

    def admin_login_step2(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'admin/auth/login/step2', data)
