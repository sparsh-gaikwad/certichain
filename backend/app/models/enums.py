import enum


class CertStatus(str, enum.Enum):
    verified = "verified"
    revoked = "revoked"