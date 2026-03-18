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
    
    @abstractmethod
    def try_lock_for_processing(self, payment_id: str) -> Optional[Payment]:
        """
        Atomically tries to lock a payment for processing by updating status 
        from 'pendiente' to 'procesando'. Returns the payment if successful, 
        None if payment not found or not in 'pendiente' status.
        """
        pass
    
    @abstractmethod
    def find_stale_pending(self, minutes: int) -> List[Payment]:
        """
        Find payments that have been in 'pendiente' status for more than
        the specified number of minutes.
        """
        pass
    
    @abstractmethod
    def mark_as_abandoned(self, payment_id: str) -> Optional[Payment]:
        """
        Mark a payment as 'abandonado'.
        """
        pass
