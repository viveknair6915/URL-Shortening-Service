from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response
from fastapi.responses import RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.schemas.url import URLCreate, URLResponse, URLStats, URLUpdate
from app.services.url_service import URLService
from app.api.deps import get_url_service

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/shorten", response_model=URLResponse, status_code=201)
async def shorten_url(
    url_in: URLCreate,
    service: URLService = Depends(get_url_service)
):
    """
    Create a shortened URL.
    """
    return await service.create_short_url(url_in)

@router.get("/shorten/{short_code}", response_model=URLResponse)
async def get_url_metadata(
    short_code: str,
    service: URLService = Depends(get_url_service)
):
    """
    Retrieve Short URL Metadata (Original URL, not redirect).
    """
    url_obj = await service.get_url_details(short_code)
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    return url_obj

@router.put("/shorten/{short_code}", response_model=URLResponse)
async def update_url(
    short_code: str,
    url_in: URLUpdate,
    service: URLService = Depends(get_url_service)
):
    """
    Update a shortened URL.
    """
    return await service.update_url(short_code, url_in)

@router.delete("/shorten/{short_code}", status_code=204)
async def delete_url(
    short_code: str,
    service: URLService = Depends(get_url_service)
):
    """
    Delete a shortened URL.
    """
    await service.delete_url(short_code)
    return Response(status_code=204)

@router.get("/shorten/{short_code}/stats", response_model=URLStats)
async def get_url_stats(
    short_code: str,
    service: URLService = Depends(get_url_service)
):
    """
    Get statistics for a shortened URL.
    """
    url_obj = await service.get_url_details(short_code)
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    return url_obj

# Redirect Endpoint
# We put this at the root router usually, but here we can define it.
# Note: The requirements say `GET /{shortCode}` for redirect.
# This router is prefixed with /api/v1 usually.
# We will define the redirect endpoint in the MAIN app file or a separate router to handle root path.
