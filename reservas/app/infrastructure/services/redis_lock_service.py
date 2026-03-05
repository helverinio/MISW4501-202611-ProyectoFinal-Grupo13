import redis
import time
import uuid
import json
import logging
from typing import Optional, Callable, Any, Dict
from contextlib import contextmanager
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)


class RedisLockError(Exception):
    """Exception raised when a Redis lock operation fails."""
    pass


class RedisLockAcquisitionError(RedisLockError):
    """Exception raised when lock acquisition fails."""
    pass


class RedisLockService:
    """
    Distributed lock service using Redis with Redlock algorithm.
    Provides pessimistic locking for critical sections like room holds.
    """
    
    def __init__(
        self,
        host: str = 'redis',
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        lock_timeout_seconds: int = 30,
        retry_times: int = 3,
        retry_delay_ms: int = 200
    ):
        self.redis_client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=True
        )
        self.lock_timeout_seconds = lock_timeout_seconds
        self.retry_times = retry_times
        self.retry_delay_ms = retry_delay_ms
        
    @classmethod
    def from_config(cls, config) -> 'RedisLockService':
        """Create a RedisLockService instance from Flask config."""
        return cls(
            host=config.get('REDIS_HOST', 'redis'),
            port=config.get('REDIS_PORT', 6379),
            db=config.get('REDIS_DB', 0),
            password=config.get('REDIS_PASSWORD'),
            lock_timeout_seconds=config.get('REDIS_LOCK_TIMEOUT_SECONDS', 30),
            retry_times=config.get('REDIS_LOCK_RETRY_TIMES', 3),
            retry_delay_ms=config.get('REDIS_LOCK_RETRY_DELAY_MS', 200)
        )
    
    def _generate_lock_value(self) -> str:
        """Generate a unique value for the lock to ensure only the owner can release it."""
        return str(uuid.uuid4())
    
    def _build_room_lock_key(self, room_id: str, fecha_ingreso: str, fecha_salida: str) -> str:
        """Build a unique lock key for a room hold operation."""
        return f"room_hold_lock:{room_id}:{fecha_ingreso}:{fecha_salida}"
    
    def acquire_lock(
        self,
        lock_key: str,
        timeout_seconds: Optional[int] = None,
        blocking: bool = True
    ) -> Optional[str]:
        """
        Acquire a distributed lock using Redis SET NX EX.
        
        Args:
            lock_key: The key to lock on
            timeout_seconds: Lock expiration time (defaults to configured value)
            blocking: If True, retry until lock is acquired or max retries reached
            
        Returns:
            Lock value (token) if acquired, None if failed
        """
        timeout = timeout_seconds or self.lock_timeout_seconds
        lock_value = self._generate_lock_value()
        
        for attempt in range(self.retry_times if blocking else 1):
            acquired = self.redis_client.set(
                lock_key,
                lock_value,
                nx=True,
                ex=timeout
            )
            
            if acquired:
                logger.info(f"[REDIS_LOCK] Lock acquired: {lock_key} (attempt {attempt + 1})")
                return lock_value
            
            if blocking and attempt < self.retry_times - 1:
                delay = self.retry_delay_ms / 1000.0
                logger.debug(f"[REDIS_LOCK] Lock busy, retrying in {delay}s: {lock_key}")
                time.sleep(delay)
        
        logger.warning(f"[REDIS_LOCK] Failed to acquire lock: {lock_key}")
        return None
    
    def release_lock(self, lock_key: str, lock_value: str) -> bool:
        """
        Release a distributed lock using Lua script for atomicity.
        Only releases if the lock value matches (owner verification).
        
        Args:
            lock_key: The key that was locked
            lock_value: The value returned when lock was acquired
            
        Returns:
            True if lock was released, False otherwise
        """
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        
        try:
            result = self.redis_client.eval(lua_script, 1, lock_key, lock_value)
            if result:
                logger.info(f"[REDIS_LOCK] Lock released: {lock_key}")
                return True
            else:
                logger.warning(f"[REDIS_LOCK] Lock not owned or expired: {lock_key}")
                return False
        except redis.RedisError as e:
            logger.error(f"[REDIS_LOCK] Error releasing lock: {lock_key} - {str(e)}")
            return False
    
    def extend_lock(self, lock_key: str, lock_value: str, additional_seconds: int) -> bool:
        """
        Extend the TTL of an existing lock (only if still owned).
        
        Args:
            lock_key: The key that was locked
            lock_value: The value returned when lock was acquired
            additional_seconds: Seconds to add to the lock TTL
            
        Returns:
            True if lock was extended, False otherwise
        """
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("expire", KEYS[1], ARGV[2])
        else
            return 0
        end
        """
        
        try:
            result = self.redis_client.eval(
                lua_script, 1, lock_key, lock_value, additional_seconds
            )
            if result:
                logger.debug(f"[REDIS_LOCK] Lock extended by {additional_seconds}s: {lock_key}")
                return True
            return False
        except redis.RedisError as e:
            logger.error(f"[REDIS_LOCK] Error extending lock: {lock_key} - {str(e)}")
            return False
    
    def is_locked(self, lock_key: str) -> bool:
        """Check if a lock key exists."""
        return bool(self.redis_client.exists(lock_key))
    
    def get_lock_ttl(self, lock_key: str) -> int:
        """Get remaining TTL of a lock in seconds."""
        return self.redis_client.ttl(lock_key)
    
    @contextmanager
    def distributed_lock(
        self,
        lock_key: str,
        timeout_seconds: Optional[int] = None,
        blocking: bool = True
    ):
        """
        Context manager for distributed locking.
        
        Usage:
            with lock_service.distributed_lock('my_key'):
                # critical section
                
        Raises:
            RedisLockAcquisitionError if lock cannot be acquired
        """
        lock_value = self.acquire_lock(lock_key, timeout_seconds, blocking)
        
        if not lock_value:
            raise RedisLockAcquisitionError(f"Could not acquire lock: {lock_key}")
        
        try:
            yield lock_value
        finally:
            self.release_lock(lock_key, lock_value)
    
    @contextmanager
    def room_hold_lock(
        self,
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str,
        timeout_seconds: Optional[int] = None,
        blocking: bool = True
    ):
        """
        Context manager specifically for room hold operations.
        Provides pessimistic locking to prevent race conditions during hold acquisition.
        
        Args:
            room_id: Room ID
            fecha_ingreso: Check-in date string
            fecha_salida: Check-out date string
            timeout_seconds: Lock expiration time
            blocking: If False, fail immediately if lock is not available (fast-fail mode)
        
        Usage:
            with lock_service.room_hold_lock(room_id, fecha_ingreso, fecha_salida):
                # check and acquire hold atomically
        """
        lock_key = self._build_room_lock_key(room_id, fecha_ingreso, fecha_salida)
        
        with self.distributed_lock(lock_key, timeout_seconds, blocking=blocking):
            yield
    
    def try_room_hold_lock(
        self,
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str,
        timeout_seconds: Optional[int] = None
    ) -> tuple[Optional[str], str]:
        """
        Try to acquire a room hold lock without raising exceptions.
        
        Returns:
            Tuple of (lock_value, lock_key) if acquired, (None, lock_key) if failed
        """
        lock_key = self._build_room_lock_key(room_id, fecha_ingreso, fecha_salida)
        lock_value = self.acquire_lock(lock_key, timeout_seconds, blocking=True)
        return lock_value, lock_key
    
    def health_check(self) -> dict:
        """Check Redis connection health."""
        try:
            self.redis_client.ping()
            return {'status': 'healthy', 'redis': 'connected'}
        except redis.RedisError as e:
            return {'status': 'unhealthy', 'redis': 'disconnected', 'error': str(e)}

    def _build_room_hold_cache_key(self, room_id: str, fecha_ingreso: str, fecha_salida: str) -> str:
        """Build a cache key for a room hold."""
        return f"room_hold_cache:{room_id}:{fecha_ingreso}:{fecha_salida}"

    def _build_room_hold_id_key(self, hold_id: str) -> str:
        """Build a cache key for looking up hold by ID."""
        return f"room_hold_id:{hold_id}"

    def cache_room_hold(
        self,
        hold_data: Dict[str, Any],
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str,
        ttl_seconds: int
    ) -> bool:
        """
        Cache a room hold in Redis with TTL matching hold expiration.
        
        Args:
            hold_data: Dictionary containing hold information
            room_id: Room ID
            fecha_ingreso: Check-in date string
            fecha_salida: Check-out date string
            ttl_seconds: Time to live in seconds (should match hold expiry)
            
        Returns:
            True if cached successfully, False otherwise
        """
        try:
            cache_key = self._build_room_hold_cache_key(room_id, fecha_ingreso, fecha_salida)
            id_key = self._build_room_hold_id_key(hold_data['id'])
            
            pipe = self.redis_client.pipeline()
            pipe.setex(cache_key, ttl_seconds, json.dumps(hold_data))
            pipe.setex(id_key, ttl_seconds, cache_key)
            pipe.execute()
            
            logger.info(f"[REDIS_CACHE] Hold cached: {cache_key} (TTL: {ttl_seconds}s)")
            return True
        except redis.RedisError as e:
            logger.error(f"[REDIS_CACHE] Error caching hold: {str(e)}")
            return False

    def get_cached_room_hold(
        self,
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a cached room hold from Redis.
        
        Returns:
            Hold data dictionary if found and not expired, None otherwise
        """
        try:
            cache_key = self._build_room_hold_cache_key(room_id, fecha_ingreso, fecha_salida)
            cached = self.redis_client.get(cache_key)
            
            if cached:
                hold_data = json.loads(cached)
                logger.debug(f"[REDIS_CACHE] Cache hit: {cache_key}")
                return hold_data
            
            logger.debug(f"[REDIS_CACHE] Cache miss: {cache_key}")
            return None
        except redis.RedisError as e:
            logger.error(f"[REDIS_CACHE] Error reading cache: {str(e)}")
            return None

    def get_cached_room_hold_by_id(self, hold_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a cached room hold by its hold ID.
        
        Returns:
            Hold data dictionary if found, None otherwise
        """
        try:
            id_key = self._build_room_hold_id_key(hold_id)
            cache_key = self.redis_client.get(id_key)
            
            if cache_key:
                cached = self.redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            return None
        except redis.RedisError as e:
            logger.error(f"[REDIS_CACHE] Error reading cache by ID: {str(e)}")
            return None

    def invalidate_room_hold_cache(
        self,
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str,
        hold_id: Optional[str] = None
    ) -> bool:
        """
        Invalidate (delete) a cached room hold.
        
        Returns:
            True if invalidated, False otherwise
        """
        try:
            cache_key = self._build_room_hold_cache_key(room_id, fecha_ingreso, fecha_salida)
            keys_to_delete = [cache_key]
            
            if hold_id:
                keys_to_delete.append(self._build_room_hold_id_key(hold_id))
            
            deleted = self.redis_client.delete(*keys_to_delete)
            logger.info(f"[REDIS_CACHE] Cache invalidated: {cache_key} (deleted: {deleted})")
            return deleted > 0
        except redis.RedisError as e:
            logger.error(f"[REDIS_CACHE] Error invalidating cache: {str(e)}")
            return False

    def invalidate_room_hold_cache_by_id(self, hold_id: str) -> bool:
        """
        Invalidate a cached room hold by its hold ID.
        
        Returns:
            True if invalidated, False otherwise
        """
        try:
            id_key = self._build_room_hold_id_key(hold_id)
            cache_key = self.redis_client.get(id_key)
            
            if cache_key:
                self.redis_client.delete(cache_key, id_key)
                logger.info(f"[REDIS_CACHE] Cache invalidated by ID: {hold_id}")
                return True
            return False
        except redis.RedisError as e:
            logger.error(f"[REDIS_CACHE] Error invalidating cache by ID: {str(e)}")
            return False

    def check_room_hold_exists_in_cache(
        self,
        room_id: str,
        fecha_ingreso: str,
        fecha_salida: str
    ) -> tuple[bool, Optional[Dict[str, Any]]]:
        """
        Quick check if a room hold exists in cache for the given dates.
        This avoids DB hit when cache confirms hold exists.
        
        Returns:
            Tuple of (exists, hold_data)
        """
        hold_data = self.get_cached_room_hold(room_id, fecha_ingreso, fecha_salida)
        return (hold_data is not None, hold_data)


def with_room_lock(
    lock_service_getter: Callable[[], RedisLockService],
    room_id_param: str = 'id_habitacion',
    fecha_ingreso_param: str = 'fecha_ingreso',
    fecha_salida_param: str = 'fecha_salida'
):
    """
    Decorator for functions that require room hold locking.
    
    Args:
        lock_service_getter: Function that returns a RedisLockService instance
        room_id_param: Name of the room ID parameter
        fecha_ingreso_param: Name of the check-in date parameter
        fecha_salida_param: Name of the check-out date parameter
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            lock_service = lock_service_getter()
            
            room_id = kwargs.get(room_id_param)
            fecha_ingreso = kwargs.get(fecha_ingreso_param)
            fecha_salida = kwargs.get(fecha_salida_param)
            
            if not all([room_id, fecha_ingreso, fecha_salida]):
                return func(*args, **kwargs)
            
            fecha_ingreso_str = str(fecha_ingreso.date()) if hasattr(fecha_ingreso, 'date') else str(fecha_ingreso)
            fecha_salida_str = str(fecha_salida.date()) if hasattr(fecha_salida, 'date') else str(fecha_salida)
            
            try:
                with lock_service.room_hold_lock(room_id, fecha_ingreso_str, fecha_salida_str):
                    return func(*args, **kwargs)
            except RedisLockAcquisitionError:
                return None
        
        return wrapper
    return decorator


_redis_lock_service: Optional[RedisLockService] = None


def init_redis_lock_service(config) -> RedisLockService:
    """Initialize the global Redis lock service."""
    global _redis_lock_service
    _redis_lock_service = RedisLockService.from_config(config)
    return _redis_lock_service


def get_redis_lock_service() -> Optional[RedisLockService]:
    """Get the global Redis lock service instance."""
    return _redis_lock_service
