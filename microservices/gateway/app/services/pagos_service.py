import requests
from typing import Dict, Any

class PagosService:
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    def _request(self, method: str, endpoint: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/api/v1/{endpoint}"
            if method == 'GET':
                response = requests.get(url, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, timeout=30)
            else:
                return {'status_code': 400, 'data': {'error': 'Invalid method'}}
            return {'status_code': response.status_code, 'data': response.json()}
        except requests.RequestException as e:
            return {'status_code': 500, 'data': {'error': str(e)}}
    
    def create_payment(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', 'payments', data)
    
    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        return self._request('GET', f'payments/{payment_id}')
    
    def get_all_payments(self) -> Dict[str, Any]:
        return self._request('GET', 'payments')
    
    def get_payment_by_reservation(self, reservation_id: str) -> Dict[str, Any]:
        return self._request('GET', f'payments/reservation/{reservation_id}')
    
    def process_payment(self, payment_id: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        return self._request('POST', f'payments/{payment_id}/process', data)
