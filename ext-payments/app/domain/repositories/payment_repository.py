from abc import ABC, abstractmethod
from typing import Optional
from app.domain.entities.payment import Payment, PaymentIntent

class PaymentIntentRepository(ABC):
    @abstractmethod
    def save(self, payment_intent: PaymentIntent) -> PaymentIntent:
        pass
    
    @abstractmethod
    def find_by_id(self, intent_id: str) -> Optional[PaymentIntent]:
        pass
    
    @abstractmethod
    def update_status(self, intent_id: str, status: str) -> Optional[PaymentIntent]:
        pass

class PaymentRepository(ABC):
    @abstractmethod
    def save(self, payment: Payment) -> Payment:
        pass
    
    @abstractmethod
    def find_by_id(self, payment_id: str) -> Optional[Payment]:
        pass
