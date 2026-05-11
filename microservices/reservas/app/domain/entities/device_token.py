from dataclasses import dataclass
from datetime import datetime
import uuid


@dataclass
class DeviceToken:
    id: str
    user_id: str
    token: str
    platform: str  # 'android', 'ios', 'expo'
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def create(user_id: str, token: str, platform: str = 'expo') -> 'DeviceToken':
        now = datetime.utcnow()
        return DeviceToken(
            id=str(uuid.uuid4()),
            user_id=user_id,
            token=token,
            platform=platform,
            created_at=now,
            updated_at=now
        )
