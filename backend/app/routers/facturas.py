from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.models import Factura
from app.schemas import FacturaCreate, FacturaUpdate, FacturaOut

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


@router.get("/", response_model=List[FacturaOut])
async def listar_facturas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Factura).order_by(Factura.fecha.desc()))
    return result.scalars().all()


@router.get("/{factura_id}", response_model=FacturaOut)
async def obtener_factura(factura_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Factura).where(Factura.id == factura_id))
    factura = result.scalar_one_or_none()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura


@router.post("/", response_model=FacturaOut, status_code=status.HTTP_201_CREATED)
async def crear_factura(data: FacturaCreate, db: AsyncSession = Depends(get_db)):
    factura = Factura(**data.model_dump())
    db.add(factura)
    await db.commit()
    await db.refresh(factura)
    return factura


@router.put("/{factura_id}", response_model=FacturaOut)
async def actualizar_factura(factura_id: int, data: FacturaUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Factura).where(Factura.id == factura_id))
    factura = result.scalar_one_or_none()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(factura, key, val)
    await db.commit()
    await db.refresh(factura)
    return factura


@router.delete("/{factura_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_factura(factura_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Factura).where(Factura.id == factura_id))
    factura = result.scalar_one_or_none()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    await db.delete(factura)
    await db.commit()
