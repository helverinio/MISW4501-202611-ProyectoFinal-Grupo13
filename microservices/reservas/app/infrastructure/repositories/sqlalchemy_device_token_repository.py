from typing import List, Optional
from datetime import datetime
from app import db
from app.domain.entities.device_token import DeviceToken
from app.domain.repositories.device_token_repository import DeviceTokenRepository
from app.infrastructure.models.device_token_model import DeviceTokenModel


class SQLAlchemyDeviceTokenRepository(DeviceTokenRepository):
    def save(self, device_token: DeviceToken) -> DeviceToken:
        model = DeviceTokenModel(
            id=device_token.id,
            user_id=device_token.user_id,
            token=device_token.token,
            platform=device_token.platform,
            created_at=device_token.created_at,
            updated_at=device_token.updated_at
        )
        db.session.add(model)
        db.session.commit()
        return device_token

    def find_by_user_id(self, user_id: str) -> List[DeviceToken]:
        models = DeviceTokenModel.query.filter_by(user_id=user_id).all()
        return [self._to_entity(m) for m in models]

    def find_by_token(self, token: str) -> Optional[DeviceToken]:
        model = DeviceTokenModel.query.filter_by(token=token).first()
        if not model:
            return None
        return self._to_entity(model)

    def delete_by_token(self, token: str) -> bool:
        model = DeviceTokenModel.query.filter_by(token=token).first()
        if model:
            db.session.delete(model)
            db.session.commit()
            return True
        return False

    def update_token(self, device_token: DeviceToken) -> DeviceToken:
        model = DeviceTokenModel.query.get(device_token.id)
        if model:
            model.user_id = device_token.user_id
            model.token = device_token.token
            model.platform = device_token.platform
            model.updated_at = datetime.utcnow()
            db.session.commit()
        return device_token

    def _to_entity(self, model: DeviceTokenModel) -> DeviceToken:
        return DeviceToken(
            id=model.id,
            user_id=model.user_id,
            token=model.token,
            platform=model.platform,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
