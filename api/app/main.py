from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import species, sightings, routes, alerts, hex
import os

app = FastAPI(
    title="speciesmap.org API",
    description="Land wildlife tracking platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://speciesmap.org",
        "https://northamerica.speciesmap.org",
        "https://southamerica.speciesmap.org",
        "https://europe.speciesmap.org",
        "https://africa.speciesmap.org",
        "https://asia.speciesmap.org",
        "https://australia.speciesmap.org",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(species.router,   prefix="/api")
app.include_router(sightings.router, prefix="/api")
app.include_router(routes.router,    prefix="/api")
app.include_router(alerts.router,    prefix="/api")
app.include_router(hex.router,       prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "speciesmap-api"}


@app.get("/api")
async def root():
    return {"message": "speciesmap.org API", "version": "0.1.0"}
