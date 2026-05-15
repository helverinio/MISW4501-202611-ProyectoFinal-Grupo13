from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.device_token import DeviceToken


class DeviceTokenRepository(ABC):
    @abstractmethod
    def save(self, device_token: DeviceToken) -> DeviceToken:
        pass

    @abstractmethod
    def find_by_user_id(self, user_id: str) -> List[DeviceToken]:
        pass

    @abstractmethod
    def find_by_token(self, token: str) -> Optional[DeviceToken]:
        pass

    @abstractmethod
    def delete_by_token(self, token: str) -> bool:
        pass

    @abstractmethod
    def update_token(self, device_token: DeviceToken) -> DeviceToken:
        pass

    @abstractmethod
    def delete_by_user_id(self, user_id: str) -> int:
        pass
