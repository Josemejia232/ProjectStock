import os as _os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import proyectos, materiales, inventario, movimientos, reportes, facturas, requisiciones


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
    except Exception as e:
        print(f"[WARN] Database init failed: {e}")
    yield


app = FastAPI(
    title="ProjectStock",
    description="Control de inventario y materiales para proyectos de construcción",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proyectos.router)
app.include_router(materiales.router)
app.include_router(inventario.router)
app.include_router(movimientos.router)
app.include_router(reportes.router)
app.include_router(facturas.router)
app.include_router(requisiciones.router)


# Montar frontend compilado solo si existe y NO estamos en Vercel
_on_vercel = _os.environ.get("VERCEL") == "1"
_dist = _os.path.join(_os.path.dirname(__file__), "../../frontend/dist")
if not _on_vercel and _os.path.exists(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")

if _on_vercel or not _os.path.exists(_dist):
    @app.get("/")
    async def root():
        return {"message": "ProjectStock API", "docs": "/docs"}
