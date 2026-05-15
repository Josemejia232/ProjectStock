from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
import io
from fpdf import FPDF

from app.database import get_db
from app.models import Requisicion, RequisicionDetalle, Movimiento, Inventario, Proyecto, Material, Factura
from app.schemas import (
    RequisicionCreate, RequisicionUpdate, RequisicionOut,
    RequisicionDetalleOut, RecibirDetalleRequest,
)

router = APIRouter(prefix="/api/requisiciones", tags=["Requisiciones"])


def build_detalle_out(d):
    out = RequisicionDetalleOut.model_validate(d)
    out.material_nombre = d.material.nombre if d.material else None
    out.factura_no = d.factura.no_factura if d.factura else None
    return out


async def load_requisicion(id: int, db: AsyncSession):
    result = await db.execute(
        select(Requisicion)
        .options(selectinload(Requisicion.proyecto))
        .options(selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.material))
        .options(selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.factura))
        .where(Requisicion.id == id)
    )
    return result.scalar_one_or_none()


def build_out(req):
    out = RequisicionOut.model_validate(req)
    out.proyecto_nombre = req.proyecto.nombre if req.proyecto else None
    out.detalles = [build_detalle_out(d) for d in req.detalles]
    return out


def actualizar_estado(req):
    total = sum(d.cantidad_solicitada for d in req.detalles)
    recibido = sum(d.cantidad_recibida for d in req.detalles)
    if recibido == 0:
        req.estado = "pendiente"
    elif recibido >= total:
        req.estado = "completada"
    else:
        req.estado = "parcial"


@router.get("/", response_model=List[RequisicionOut])
async def listar_requisiciones(proyecto_id: int = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Requisicion).options(
        selectinload(Requisicion.proyecto),
        selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.material),
        selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.factura),
    ).order_by(Requisicion.fecha_solicitud.desc())
    if proyecto_id:
        stmt = stmt.where(Requisicion.proyecto_id == proyecto_id)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [build_out(r) for r in rows]


@router.post("/", response_model=RequisicionOut, status_code=status.HTTP_201_CREATED)
async def crear_requisicion(data: RequisicionCreate, db: AsyncSession = Depends(get_db)):
    # Auto-generate no_requisicion
    count = await db.execute(select(func.count(Requisicion.id)).where(Requisicion.proyecto_id == data.proyecto_id))
    seq = (count.scalar() or 0) + 1
    no_requisicion = f"REQ-{data.proyecto_id}-{seq:04d}"

    req = Requisicion(
        proyecto_id=data.proyecto_id,
        residente=data.residente,
        no_requisicion=no_requisicion,
        destino_uso=data.destino_uso,
        aprobado_por=data.aprobado_por,
        elaborado_por=data.elaborado_por,
    )
    for d in data.detalles:
        req.detalles.append(RequisicionDetalle(**d.model_dump()))
    db.add(req)
    await db.commit()
    await db.refresh(req)
    loaded = await load_requisicion(req.id, db)
    return build_out(loaded)


@router.put("/{requisicion_id}", response_model=RequisicionOut)
async def actualizar_requisicion(requisicion_id: int, data: RequisicionUpdate, db: AsyncSession = Depends(get_db)):
    req = await load_requisicion(requisicion_id, db)
    if not req:
        raise HTTPException(status_code=404, detail="Requisicion no encontrada")
    if req.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se puede editar requisiciones pendientes")

    if data.residente is not None:
        req.residente = data.residente
    if data.aprobado_por is not None:
        req.aprobado_por = data.aprobado_por
    if data.elaborado_por is not None:
        req.elaborado_por = data.elaborado_por
    if data.detalles is not None:
        req.detalles.clear()
        for d in data.detalles:
            req.detalles.append(RequisicionDetalle(**d.model_dump()))

    await db.commit()
    loaded = await load_requisicion(requisicion_id, db)
    return build_out(loaded)


@router.delete("/{requisicion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_requisicion(requisicion_id: int, db: AsyncSession = Depends(get_db)):
    req = await load_requisicion(requisicion_id, db)
    if not req:
        raise HTTPException(status_code=404, detail="Requisicion no encontrada")
    if req.estado != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se puede eliminar requisiciones pendientes")
    await db.delete(req)
    await db.commit()


@router.post("/recibir/{detalle_id}", response_model=RequisicionDetalleOut)
async def recibir_detalle(detalle_id: int, data: RecibirDetalleRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RequisicionDetalle)
        .options(selectinload(RequisicionDetalle.requisicion).selectinload(Requisicion.detalles))
        .options(selectinload(RequisicionDetalle.material))
        .options(selectinload(RequisicionDetalle.factura))
        .where(RequisicionDetalle.id == detalle_id)
    )
    detalle = result.scalar_one_or_none()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")

    detalle.material_id = data.material_id
    detalle.cantidad_recibida += data.cantidad_recibida
    detalle.factura_id = data.factura_id or detalle.factura_id

    # Crear movimiento tipo entrada
    desc = f"Req #{detalle.requisicion_id} — {detalle.material_solicitado}"
    mov = Movimiento(
        proyecto_id=detalle.requisicion.proyecto_id,
        material_id=data.material_id,
        tipo="entrada",
        cantidad=data.cantidad_recibida,
        descripcion=desc,
        usuario=detalle.requisicion.residente or "Admin",
    )
    db.add(mov)

    # Actualizar inventario
    inv_result = await db.execute(
        select(Inventario).where(
            Inventario.proyecto_id == detalle.requisicion.proyecto_id,
            Inventario.material_id == data.material_id,
        )
    )
    inventario = inv_result.scalar_one_or_none()
    if inventario:
        inventario.cantidad_actual += data.cantidad_recibida
    else:
        inv = Inventario(
            proyecto_id=detalle.requisicion.proyecto_id,
            material_id=data.material_id,
            cantidad_actual=data.cantidad_recibida,
        )
        db.add(inv)

    # Actualizar estado de la requisicion
    actualizar_estado(detalle.requisicion)

    await db.commit()
    await db.refresh(detalle)

    # Re-cargar con relaciones
    result2 = await db.execute(
        select(RequisicionDetalle)
        .options(selectinload(RequisicionDetalle.material))
        .options(selectinload(RequisicionDetalle.factura))
        .where(RequisicionDetalle.id == detalle_id)
    )
    return build_detalle_out(result2.scalar_one())


@router.put("/recibir/{detalle_id}", response_model=RequisicionDetalleOut)
async def actualizar_recibido(detalle_id: int, data: RecibirDetalleRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RequisicionDetalle)
        .options(selectinload(RequisicionDetalle.requisicion).selectinload(Requisicion.detalles))
        .options(selectinload(RequisicionDetalle.material))
        .options(selectinload(RequisicionDetalle.factura))
        .where(RequisicionDetalle.id == detalle_id)
    )
    detalle = result.scalar_one_or_none()
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")

    old_cantidad = detalle.cantidad_recibida
    diff = data.cantidad_recibida - old_cantidad

    detalle.material_id = data.material_id
    detalle.cantidad_recibida = data.cantidad_recibida
    detalle.factura_id = data.factura_id or detalle.factura_id

    # Adjust inventory by the difference
    inv_result = await db.execute(
        select(Inventario).where(
            Inventario.proyecto_id == detalle.requisicion.proyecto_id,
            Inventario.material_id == data.material_id,
        )
    )
    inventario = inv_result.scalar_one_or_none()
    if inventario:
        inventario.cantidad_actual += diff
    else:
        inv = Inventario(
            proyecto_id=detalle.requisicion.proyecto_id,
            material_id=data.material_id,
            cantidad_actual=diff,
        )
        db.add(inv)

    # Create adjustment movement if quantity changed
    if diff != 0:
        desc = f"Corrección Req #{detalle.requisicion_id} — {detalle.material_solicitado}"
        mov = Movimiento(
            proyecto_id=detalle.requisicion.proyecto_id,
            material_id=data.material_id,
            tipo="entrada" if diff > 0 else "salida",
            cantidad=abs(diff),
            descripcion=desc,
            usuario=detalle.requisicion.residente or "Admin",
        )
        db.add(mov)

    actualizar_estado(detalle.requisicion)
    await db.commit()
    await db.refresh(detalle)

    result2 = await db.execute(
        select(RequisicionDetalle)
        .options(selectinload(RequisicionDetalle.material))
        .options(selectinload(RequisicionDetalle.factura))
        .where(RequisicionDetalle.id == detalle_id)
    )
    return build_detalle_out(result2.scalar_one())


@router.get("/exportar-pdf")
async def exportar_requisiciones_pdf(proyecto_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Requisicion).options(
        selectinload(Requisicion.proyecto),
        selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.material),
        selectinload(Requisicion.detalles).selectinload(RequisicionDetalle.factura),
    ).order_by(Requisicion.fecha_solicitud.desc())
    if proyecto_id:
        stmt = stmt.where(Requisicion.proyecto_id == proyecto_id)
    result = await db.execute(stmt)
    items = result.scalars().all()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Requisiciones de Materiales", ln=True, align="C")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 5, f"Generado: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align="C")
    pdf.ln(5)

    for req in items:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, f"Req: {req.no_requisicion or '#'+str(req.id)} | {req.proyecto.nombre if req.proyecto else '-'}", ln=True)
        pdf.set_font("Helvetica", "", 8)
        pdf.cell(0, 4, f"Residente: {req.residente} | Fecha: {req.fecha_solicitud.strftime('%Y-%m-%d') if req.fecha_solicitud else '-'} | Destino: {req.destino_uso or '-'}", ln=True)
        pdf.cell(0, 4, f"Estado: {req.estado}", ln=True)
        pdf.ln(2)

        # Tabla de detalles
        col_w = [70, 25, 20, 25, 25]
        headers = ["Material", "Cant", "Unidad", "Recibido", "Estado"]
        pdf.set_font("Helvetica", "B", 7)
        for i, h in enumerate(headers):
            pdf.cell(col_w[i], 5, h, border=1, align="C")
        pdf.ln()

        pdf.set_font("Helvetica", "", 7)
        for det in req.detalles:
            pdf.cell(col_w[0], 5, det.material_solicitado[:50], border=1)
            pdf.cell(col_w[1], 5, str(det.cantidad_solicitada), border=1, align="C")
            pdf.cell(col_w[2], 5, det.unidad, border=1, align="C")
            pdf.cell(col_w[3], 5, str(det.cantidad_recibida) if det.cantidad_recibida > 0 else "-", border=1, align="C")
            pdf.cell(col_w[4], 5, req.estado, border=1, align="C")
            pdf.ln()

        pdf.ln(5)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=requisiciones.pdf"},
    )


@router.get("/{requisicion_id}/pdf")
async def exportar_requisicion_pdf(requisicion_id: int, db: AsyncSession = Depends(get_db)):
    req = await load_requisicion(requisicion_id, db)
    if not req:
        raise HTTPException(status_code=404, detail="Requisicion no encontrada")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Requisicion de Materiales", ln=True, align="C")
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 5, f"Generado: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align="C")
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 10)
    proy = req.proyecto.nombre if req.proyecto else "-"
    pdf.cell(0, 6, f"Req: {req.no_requisicion or '#'+str(req.id)} | {proy}", ln=True)
    pdf.set_font("Helvetica", "", 8)
    fecha = req.fecha_solicitud.strftime('%Y-%m-%d') if req.fecha_solicitud else "-"
    pdf.cell(0, 4, f"Residente: {req.residente} | Fecha: {fecha} | Destino: {req.destino_uso or '-'}", ln=True)
    pdf.cell(0, 4, f"Estado: {req.estado}", ln=True)
    pdf.ln(4)

    col_w = [70, 25, 20, 25, 25]
    headers = ["Material", "Cant", "Unidad", "Recibido", "Estado"]
    pdf.set_font("Helvetica", "B", 7)
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 5, h, border=1, align="C")
    pdf.ln()

    pdf.set_font("Helvetica", "", 7)
    for det in req.detalles:
        pdf.cell(col_w[0], 5, det.material_solicitado[:50], border=1)
        pdf.cell(col_w[1], 5, str(det.cantidad_solicitada), border=1, align="C")
        pdf.cell(col_w[2], 5, det.unidad, border=1, align="C")
        pdf.cell(col_w[3], 5, str(det.cantidad_recibida) if det.cantidad_recibida > 0 else "-", border=1, align="C")
        pdf.cell(col_w[4], 5, req.estado, border=1, align="C")
        pdf.ln()

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    filename = f"requisicion_{req.no_requisicion or req.id}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
