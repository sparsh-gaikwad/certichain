from sqlalchemy import Column, String, Integer, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import CertStatus


class Certificate(Base):
    __tablename__ = "certificates"

    id         = Column(Integer, primary_key=True, index=True)
    cert_id    = Column(String(50), unique=True, nullable=False, index=True)
    name       = Column(String(150), nullable=False)
    sid        = Column(String(50), nullable=False)
    degree     = Column(String(200), nullable=False)
    uni        = Column(String(150), nullable=False)
    year       = Column(Integer, nullable=False)
    gpa        = Column(String(50), nullable=True)
    notes      = Column(Text, nullable=True)
    hash       = Column(String(64), nullable=False, unique=True, index=True)
    block_num  = Column(Integer, nullable=False)
    status     = Column(Enum(CertStatus), default=CertStatus.verified, nullable=False)
    issued_at  = Column(DateTime(timezone=True), server_default=func.now())