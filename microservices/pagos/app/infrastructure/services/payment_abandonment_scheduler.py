import logging
import threading
import time

logger = logging.getLogger(__name__)


class PaymentAbandonmentScheduler:
    STALE_PAYMENT_MINUTES = 20
    CHECK_INTERVAL_SECONDS = 60
    
    def __init__(self, app, check_interval_seconds: int = None, stale_minutes: int = None):
        self.app = app
        self.check_interval = check_interval_seconds or self.CHECK_INTERVAL_SECONDS
        self.stale_minutes = stale_minutes or self.STALE_PAYMENT_MINUTES
        self._thread = None
        self._running = False

    def _process_abandoned_payments(self):
        from app.infrastructure.repositories.sqlalchemy_payment_repository import SQLAlchemyPaymentRepository
        
        repo = SQLAlchemyPaymentRepository()
        stale_payments = repo.find_stale_pending(self.stale_minutes)
        
        if stale_payments:
            logger.info(f"[ABANDONMENT] Found {len(stale_payments)} stale pending payment(s)")
        
        for payment in stale_payments:
            try:
                updated = repo.mark_as_abandoned(payment.id)
                if updated:
                    logger.info(f"[ABANDONMENT] Payment {payment.id} marked as 'abandonado' (created_at: {payment.created_at})")
            except Exception as e:
                logger.error(f"[ABANDONMENT] Failed to mark payment {payment.id} as abandoned: {str(e)}")

    def start(self):
        def run_scheduler():
            logger.info(f"[ABANDONMENT] Scheduler started (check_interval={self.check_interval}s, stale_minutes={self.stale_minutes})")
            self._running = True
            
            while self._running:
                try:
                    with self.app.app_context():
                        self._process_abandoned_payments()
                except Exception as e:
                    logger.error(f"[ABANDONMENT] Scheduler error: {str(e)}")
                
                time.sleep(self.check_interval)

        self._thread = threading.Thread(target=run_scheduler, daemon=True)
        self._thread.start()
        logger.info("[ABANDONMENT] Payment abandonment scheduler started in background thread")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
            logger.info("[ABANDONMENT] Scheduler stopped")
