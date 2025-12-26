from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.db.session import get_db
from app.core.redis import get_redis_client
from app.services.url_service import URLService

async def get_url_service(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis_client)
) -> URLService:
    return URLService(db, redis)
