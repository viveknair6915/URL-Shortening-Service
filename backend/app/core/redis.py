import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self._redis: redis.Redis | None = None

    async def get_redis(self) -> redis.Redis:
        if not self._redis:
            self._redis = await redis.from_url(
                self.redis_url, 
                encoding="utf-8", 
                decode_responses=True
            )
        return self._redis

    async def close(self):
        if self._redis:
            await self._redis.close()

redis_client = RedisClient()

async def get_redis_client() -> redis.Redis:
    return await redis_client.get_redis()
