from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.certificate import Certificate
from app.models.enums import CertStatus
from app.schemas.certificate import CertificateCreate, CertificateOut, RevokeRequest, VerifyResult

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


# ── CREATE ──────────────────────────────────────────────────
@router.post("/", response_model=CertificateOut, status_code=201)
def create_certificate(payload: CertificateCreate, db: Session = Depends(get_db)):
    if db.query(Certificate).filter(Certificate.cert_id == payload.cert_id).first():
        raise HTTPException(409, "Certificate ID already exists")
    cert = Certificate(**payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


# ── GET ALL ─────────────────────────────────────────────────
@router.get("/", response_model=List[CertificateOut])
def list_certificates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Certificate).order_by(Certificate.id.desc()).offset(skip).limit(limit).all()


# ── GET ONE ─────────────────────────────────────────────────
@router.get("/{cert_id}", response_model=CertificateOut)
def get_certificate(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.cert_id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    return cert


# ── VERIFY (by ID or hash prefix) ───────────────────────────
@router.get("/verify/{query}", response_model=VerifyResult)
def verify_certificate(query: str, db: Session = Depends(get_db)):
    cert = (
        db.query(Certificate)
        .filter(
            (Certificate.cert_id == query) |
            (Certificate.hash == query) |
            Certificate.hash.like(f"{query}%")
        )
        .first()
    )
    if not cert:
        return VerifyResult(found=False, message="Not found on blockchain")
    if cert.status == CertStatus.revoked:
        return VerifyResult(found=True, cert=cert, message="Certificate has been revoked")
    return VerifyResult(found=True, cert=cert, message="Certificate is authentic")


# ── REVOKE ───────────────────────────────────────────────────
@router.patch("/revoke", response_model=CertificateOut)
def revoke_certificate(payload: RevokeRequest, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.cert_id == payload.cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    if cert.status == CertStatus.revoked:
        raise HTTPException(400, "Already revoked")
    cert.status = CertStatus.revoked
    db.commit()
    db.refresh(cert)
    return cert


# ── DELETE ───────────────────────────────────────────────────
@router.delete("/{cert_id}", status_code=204)
def delete_certificate(cert_id: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.cert_id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Certificate not found")
    db.delete(cert)
    db.commit()


# ── STATS ────────────────────────────────────────────────────
@router.get("/stats/summary")
def stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total    = db.query(Certificate).count()
    revoked  = db.query(Certificate).filter(Certificate.status == CertStatus.revoked).count()
    unis     = db.query(func.count(func.distinct(Certificate.uni))).scalar()
    return {"total": total, "revoked": revoked, "universities": unis}