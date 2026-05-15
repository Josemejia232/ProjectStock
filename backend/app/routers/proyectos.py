from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Proyecto
from app.schemas import ProyectoCreate, ProyectoUpdate, ProyectoOut

router = APIRouter(prefix="/api/proyectos", tags=["Proyectos"])


@router.get("/", response_model=List[ProyectoOut])
async def listar_proyectos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Proyecto).order_by(Proyecto.updated_at.desc()))
    return result.scalars().all()


@router.get("/{proyecto_id}", response_model=ProyectoOut)
async def obtener_proyecto(proyecto_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Proyecto).where(Proyecto.id == proyecto_id))
    proyecto = result.scalar_one_or_none()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return proyecto


@router.post("/", response_model=ProyectoOut, status_code=status.HTTP_201_CREATED)
async def crear_proyecto(data: ProyectoCreate, db: AsyncSession = Depends(get_db)):
    proyecto = Proyecto(**data.model_dump())
    db.add(proyecto)
    await db.commit()
    await db.refresh(proyecto)
    return proyecto


@router.put("/{proyecto_id}", response_model=ProyectoOut)
async def actualizar_proyecto(proyecto_id: int, data: ProyectoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Proyecto).where(Proyecto.id == proyecto_id))
    proyecto = result.scalar_one_or_none()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(proyecto, key, val)
    await db.commit()
    await db.refresh(proyecto)
    return proyecto


@router.delete("/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_proyecto(proyecto_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Proyecto).where(Proyecto.id == proyecto_id))
    proyecto = result.scalar_one_or_none()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    await db.delete(proyecto)
    await db.commit()
