from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.routes import certificates

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CertiChain API",
    version="1.0.0",
    description="Blockchain Certificate Verification Backend"
)

# ── CORS — allow your frontend origin ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(certificates.router)


@app.get("/")
def root():
    return {"status": "CertiChain API is live 🚀"}