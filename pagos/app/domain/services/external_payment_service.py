from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class ExternalPaymentService(ABC):
    @abstractmethod
    def create_payment_intent(self, amount: float, currency: str, description: Optional[str] = None,
                              webhook_url: Optional[str] = None) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def make_payment(self, payment_intent_id: str, payment_method: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def get_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        pass
