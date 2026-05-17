import os as _os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.responses import RedirectResponse

from app.database import init_db
from app.routers import proyectos, materiales, inventario, movimientos, reportes, facturas, requisiciones, usuarios, auth
from app.auth import decode_token


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

@app.middleware("http")
async def add_trailing_slash(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and "/" not in path[5:] and not path.endswith("/"):
        return RedirectResponse(path + "/", status_code=307)
    return await call_next(request)

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and not path.startswith("/api/auth/"):
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        if not token or not decode_token(token):
            return JSONResponse(status_code=401, content={"detail": "No autorizado"})
    return await call_next(request)

app.include_router(proyectos.router)
app.include_router(materiales.router)
app.include_router(inventario.router)
app.include_router(movimientos.router)
app.include_router(reportes.router)
app.include_router(facturas.router)
app.include_router(requisiciones.router)
app.include_router(usuarios.router)
app.include_router(auth.router)

# Montar frontend compilado si existe (local dev: frontend/dist, Vercel: backend/static)
_dist = _os.path.join(_os.path.dirname(__file__), "../static")
if not _os.path.exists(_dist):
    _dist = _os.path.join(_os.path.dirname(__file__), "../../frontend/dist")
if _os.path.exists(_dist):
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")
