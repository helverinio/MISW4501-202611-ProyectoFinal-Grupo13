from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.payment import Payment

class PaymentRepository(ABC):
    @abstractmethod
    def find_all(self) -> List[Payment]:
        pass
    
    @abstractmethod
    def save(self, payment: Payment) -> Payment:
        pass
    
    @abstractmethod
    def find_by_id(self, payment_id: str) -> Optional[Payment]:
        pass
    
    @abstractmethod
    def find_by_external_id(self, external_payment_id: str) -> Optional[Payment]:
        pass
    
    @abstractmethod
    def find_by_reservation_id(self, reservation_id: str) -> Optional[Payment]:
        pass
    
    @abstractmethod
    def find_by_payment_intent_id(self, payment_intent_id: str) -> Optional[Payment]:
        pass
    
    @abstractmethod
    def update_status(self, payment_id: str, status: str) -> Optional[Payment]:
        pass
    
    @abstractmethod
    def update_status_by_intent(self, payment_intent_id: str, status: str) -> Optional[Payment]:
        pass
