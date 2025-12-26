from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from redis.asyncio import Redis
from fastapi import HTTPException, status
from nanoid import generate
from datetime import timedelta
import logging

from app.models.url import URL
from app.schemas.url import URLCreate, URLUpdate
from app.core.config import settings

logger = logging.getLogger(__name__)

CACHE_TTL = 86400  # 24 hours

class URLService:
    def __init__(self, db: AsyncSession, redis: Redis):
        self.db = db
        self.redis = redis

    async def create_short_url(self, url_in: URLCreate) -> URL:
        # Generate unique short code
        # Loop to ensure uniqueness (though with NanoID collision is rare)
        for _ in range(5):
            short_code = generate(size=8)
            existing = await self.get_url_by_code_db(short_code)
            if not existing:
                break
        else:
            raise HTTPException(status_code=500, detail="Could not generate unique code")

        db_obj = URL(
            url=str(url_in.url),
            short_code=short_code
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)

        # Cache the new URL (mapped short_code -> url)
        await self._cache_url(short_code, str(url_in.url))
        
        return db_obj

    async def get_url(self, short_code: str) -> str | None:
        # Try Redis first
        cached_url = await self.redis.get(f"short:{short_code}")
        if cached_url:
            return cached_url

        # Fallback to DB
        db_obj = await self.get_url_by_code_db(short_code)
        if db_obj:
            await self._cache_url(short_code, db_obj.url)
            return db_obj.url
        
        return None

    async def get_url_details(self, short_code: str) -> URL | None:
        return await self.get_url_by_code_db(short_code)

    async def update_url(self, short_code: str, url_in: URLUpdate) -> URL:
        db_obj = await self.get_url_by_code_db(short_code)
        if not db_obj:
            raise HTTPException(status_code=404, detail="URL not found")

        db_obj.url = str(url_in.url)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)

        # Update cache
        await self._cache_url(short_code, str(url_in.url))

        return db_obj

    async def delete_url(self, short_code: str):
        db_obj = await self.get_url_by_code_db(short_code)
        if not db_obj:
            raise HTTPException(status_code=404, detail="URL not found")

        await self.db.delete(db_obj)
        await self.db.commit()

        # Invalidate cache
        await self.redis.delete(f"short:{short_code}")

    # Helper to clean code
    async def get_url_by_code_db(self, short_code: str) -> URL | None:
        result = await self.db.execute(select(URL).filter(URL.short_code == short_code))
        return result.scalars().first()

    async def increment_access_count(self, short_code: str):
        # We can implement this optimization: 
        # Increment in Redis for speed, and sync to DB periodically?
        # But requirement says "Persist async DB update" upon redirect.
        # We will do this in the background task.
        db_obj = await self.get_url_by_code_db(short_code)
        if db_obj:
            db_obj.access_count += 1
            self.db.add(db_obj)
            await self.db.commit()

            # Update cache if we were caching stats, but we are only caching URL for redirect
            # If we want to cache stats, we would set another key.
    
    async def _cache_url(self, short_code: str, url: str):
        await self.redis.set(f"short:{short_code}", url, ex=CACHE_TTL)
