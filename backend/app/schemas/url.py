from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID

class URLBase(BaseModel):
    url: str

class URLCreate(URLBase):
    pass

class URLUpdate(URLBase):
    pass

class URLInDBBase(URLBase):
    id: UUID
    short_code: str
    access_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class URLResponse(URLInDBBase):
    pass

class URLStats(URLInDBBase):
    pass
