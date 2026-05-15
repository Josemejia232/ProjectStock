from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.database import get_db
from app.models import Inventario, Proyecto, Material
from app.schemas import InventarioCreate, InventarioUpdate, InventarioOut

router = APIRouter(prefix="/api/inventario", tags=["Inventario"])


def build_out(inventario, proyecto_nombre=None, material_nombre=None, material_unidad=None):
    out = InventarioOut.model_validate(inventario)
    out.proyecto_nombre = proyecto_nombre or (inventario.proyecto.nombre if inventario.proyecto else None)
    out.material_nombre = material_nombre or (inventario.material.nombre if inventario.material else None)
    out.material_unidad = material_unidad or (inventario.material.unidad_medida if inventario.material else None)
    return out


@router.get("/", response_model=List[InventarioOut])
async def listar_inventario(
    proyecto_id: int = None,
    material_id: int = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Inventario, Proyecto.nombre, Material.nombre, Material.unidad_medida)
        .join(Proyecto, Inventario.proyecto_id == Proyecto.id)
        .join(Material, Inventario.material_id == Material.id)
    )
    if proyecto_id:
        stmt = stmt.where(Inventario.proyecto_id == proyecto_id)
    if material_id:
        stmt = stmt.where(Inventario.material_id == material_id)

    result = await db.execute(stmt)
    rows = result.all()
    return [build_out(inv, proy_nombre, mat_nombre, mat_unidad) for inv, proy_nombre, mat_nombre, mat_unidad in rows]


@router.get("/{inventario_id}", response_model=InventarioOut)
async def obtener_inventario(inventario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Inventario, Proyecto.nombre, Material.nombre, Material.unidad_medida)
        .join(Proyecto, Inventario.proyecto_id == Proyecto.id)
        .join(Material, Inventario.material_id == Material.id)
        .where(Inventario.id == inventario_id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    inv, proy_nombre, mat_nombre, mat_unidad = row
    return build_out(inv, proy_nombre, mat_nombre, mat_unidad)


@router.post("/", response_model=InventarioOut, status_code=status.HTTP_201_CREATED)
async def crear_inventario(data: InventarioCreate, db: AsyncSession = Depends(get_db)):
    existente = await db.execute(
        select(Inventario).where(
            Inventario.proyecto_id == data.proyecto_id,
            Inventario.material_id == data.material_id,
        )
    )
    if existente.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El material ya está registrado en este proyecto")

    inventario = Inventario(**data.model_dump())
    db.add(inventario)
    await db.commit()
    await db.refresh(inventario)

    result = await db.execute(
        select(Proyecto.nombre, Material.nombre, Material.unidad_medida)
        .where(Proyecto.id == inventario.proyecto_id, Material.id == inventario.material_id)
    )
    proy_nombre, mat_nombre, mat_unidad = result.one()
    return build_out(inventario, proy_nombre, mat_nombre, mat_unidad)


@router.put("/{inventario_id}", response_model=InventarioOut)
async def actualizar_inventario(inventario_id: int, data: InventarioUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventario).where(Inventario.id == inventario_id))
    inventario = result.scalar_one_or_none()
    if not inventario:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(inventario, key, val)
    await db.commit()
    await db.refresh(inventario)

    result = await db.execute(
        select(Proyecto.nombre, Material.nombre, Material.unidad_medida)
        .where(Proyecto.id == inventario.proyecto_id, Material.id == inventario.material_id)
    )
    proy_nombre, mat_nombre, mat_unidad = result.one()
    return build_out(inventario, proy_nombre, mat_nombre, mat_unidad)


@router.delete("/{inventario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_inventario(inventario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventario).where(Inventario.id == inventario_id))
    inventario = result.scalar_one_or_none()
    if not inventario:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    await db.delete(inventario)
    await db.commit()
