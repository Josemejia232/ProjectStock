import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, engine
from app.models import Usuario
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UsuarioOut
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/health")
async def health():
    result = {"status": "ok"}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            result["db"] = "ok"
    except Exception as e:
        result["db"] = f"error: {e}"
        result["db_traceback"] = traceback.format_exc()
    try:
        from jose import jwt
        result["jose"] = "ok"
    except Exception as e:
        result["jose"] = f"error: {e}"
    try:
        from passlib.context import CryptContext
        result["passlib"] = "ok"
    except Exception as e:
        result["passlib"] = f"error: {e}"
    return result


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        existing = await db.execute(select(Usuario).where(Usuario.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")

        usuario = Usuario(
            email=data.email,
            password_hash=hash_password(data.password),
            nombre=data.nombre,
            rol="usuario",
        )
        db.add(usuario)
        await db.commit()
        await db.refresh(usuario)

        token = create_access_token({"sub": usuario.id})
        user_out = UsuarioOut.model_validate(usuario)
        return TokenResponse(access_token=token, user=user_out)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Error interno: {e}", "traceback": traceback.format_exc()})


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Usuario).where(Usuario.email == data.email))
        usuario = result.scalar_one_or_none()

        if not usuario or not usuario.password_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

        if not verify_password(data.password, usuario.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email o contraseña incorrectos")

        token = create_access_token({"sub": usuario.id})
        user_out = UsuarioOut.model_validate(usuario)
        return TokenResponse(access_token=token, user=user_out)
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Error interno: {e}", "traceback": traceback.format_exc()})


@router.get("/me", response_model=UsuarioOut)
async def me(user: Usuario = Depends(get_current_user)):
    try:
        return UsuarioOut.model_validate(user)
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Error interno: {e}", "traceback": traceback.format_exc()})
