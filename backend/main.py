from fastapi import FastAPI, Depends, Request, Response, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.exceptions import http_exception_handler, generic_exception_handler
from app.api.v1.endpoints import urls
from app.api.deps import get_url_service
from app.services.url_service import URLService
from starlette.exceptions import HTTPException as StarletteHTTPException

# Setup Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    default_response_class=JSONResponse
)

# State for limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Exception Handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# API Router
app.include_router(urls.router, prefix=settings.API_V1_STR, tags=["urls"])

# Root Redirect Endpoint
@app.get("/{short_code}", response_class=RedirectResponse, status_code=301)
@limiter.limit("10/minute")
async def redirect_to_url(
    request: Request,
    short_code: str,
    background_tasks: BackgroundTasks,
    service: URLService = Depends(get_url_service)
):
    """
    Redirect to original URL.
    Rate Limit: 10 requests per minute per IP.
    """
    url = await service.get_url(short_code)
    
    if not url:
        # Per requirements: "Graceful 429" is handled by SlowAPI, but for 404 we return standard 404
        # Requirement says "Return 404 if not found" for GET /shorten/{shortCode} metadata.
        # For redirect, it also implies 404 if not found.
        # We can throw HTTPException here.
        raise StarletteHTTPException(status_code=404, detail="URL not found")

    # Persist async DB update
    background_tasks.add_task(service.increment_access_count, short_code)
    
    return RedirectResponse(url=url, status_code=301)

@app.get("/health")
def health_check():
    return {"status": "ok"}
