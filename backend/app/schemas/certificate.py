from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.enums import CertStatus


class CertificateCreate(BaseModel):
    cert_id:   str
    name:      str
    sid:       str
    degree:    str
    uni:       str
    year:      int
    gpa:       Optional[str] = None
    notes:     Optional[str] = None
    hash:      str
    block_num: int


class CertificateOut(BaseModel):
    id:        int
    cert_id:   str
    name:      str
    sid:       str
    degree:    str
    uni:       str
    year:      int
    gpa:       Optional[str]
    notes:     Optional[str]
    hash:      str
    block_num: int
    status:    CertStatus
    issued_at: datetime

    class Config:
        from_attributes = True


class RevokeRequest(BaseModel):
    cert_id: str


class VerifyResult(BaseModel):
    found:   bool
    cert:    Optional[CertificateOut] = None
    message: str