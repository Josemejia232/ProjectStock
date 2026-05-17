from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioSync, UsuarioOut

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


@router.post("/sync", response_model=UsuarioOut)
async def sync_usuario(data: UsuarioSync, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Usuario).where(Usuario.supabase_id == data.supabase_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.email = data.email
        existing.nombre = data.nombre
    else:
        existing = Usuario(
            supabase_id=data.supabase_id,
            email=data.email,
            nombre=data.nombre,
        )
        db.add(existing)

    await db.commit()
    await db.refresh(existing)
    return existing


@router.get("/me/{supabase_id}", response_model=UsuarioOut)
async def get_usuario(supabase_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Usuario).where(Usuario.supabase_id == supabase_id)
    )
    usuario = result.scalar_one_or_none()
    if not usuario:
        return None
    return usuario
