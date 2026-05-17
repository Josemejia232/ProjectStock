from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from app.database import Base


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class EstadoProyecto(str, enum.Enum):
    EJECUCION = "ejecucion"
    PAUSADO = "pausado"
    FINALIZADO = "finalizado"


class TipoMovimiento(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"


class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, default="")
    ubicacion = Column(String(300), default="")
    responsable = Column(String(200), default="")
    email = Column(String(200), default="")
    movil = Column(String(50), default="")
    fecha_inicio = Column(DateTime, default=_now)
    fecha_fin = Column(DateTime, nullable=True)
    estado = Column(String(20), default=EstadoProyecto.EJECUCION.value)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    inventarios = relationship("Inventario", back_populates="proyecto", cascade="all, delete-orphan")
    movimientos = relationship("Movimiento", back_populates="proyecto", cascade="all, delete-orphan")


class Material(Base):
    __tablename__ = "materiales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, unique=True)
    unidad_medida = Column(String(20), nullable=False)
    categoria = Column(String(100), default="General")
    precio_unitario = Column(Float, default=0.0)
    proveedor = Column(String(200), default="")
    created_at = Column(DateTime, default=_now)

    inventarios = relationship("Inventario", back_populates="material", cascade="all, delete-orphan")
    movimientos = relationship("Movimiento", back_populates="material", cascade="all, delete-orphan")


class Inventario(Base):
    __tablename__ = "inventarios"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    cantidad_actual = Column(Float, default=0.0)
    cantidad_minima = Column(Float, default=0.0)
    cantidad_maxima = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    proyecto = relationship("Proyecto", back_populates="inventarios")
    material = relationship("Material", back_populates="inventarios")


class Movimiento(Base):
    __tablename__ = "movimientos"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(20), nullable=False)
    cantidad = Column(Float, nullable=False)
    descripcion = Column(Text, default="")
    usuario = Column(String(100), default="")
    no_remision = Column(String(100), default="")
    categoria = Column(String(20), default="normal")
    fecha = Column(DateTime, default=_now)

    proyecto = relationship("Proyecto", back_populates="movimientos")
    material = relationship("Material", back_populates="movimientos")


class PrecioHistorico(Base):
    __tablename__ = "precios_historicos"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="CASCADE"), nullable=False)
    precio_anterior = Column(Float, default=0.0)
    precio_nuevo = Column(Float, default=0.0)
    fecha = Column(DateTime, default=_now)

    material = relationship("Material")


class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=_now)
    no_factura = Column(String(100), nullable=False)
    proveedor = Column(String(200), default="")
    insumo = Column(String(300), default="")
    valor = Column(Float, default=0.0)
    created_at = Column(DateTime, default=_now)


class Requisicion(Base):
    __tablename__ = "requisiciones"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    residente = Column(String(200), default="")
    no_requisicion = Column(String(100), default="")
    destino_uso = Column(String(300), default="")
    aprobado_por = Column(String(200), default="")
    elaborado_por = Column(String(200), default="")
    fecha_solicitud = Column(DateTime, default=_now)
    estado = Column(String(20), default="pendiente")

    proyecto = relationship("Proyecto")
    detalles = relationship("RequisicionDetalle", back_populates="requisicion", cascade="all, delete-orphan")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    supabase_id = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=False)
    nombre = Column(String(200), default="")
    rol = Column(String(50), default="usuario")
    created_at = Column(DateTime, default=_now)


class RequisicionDetalle(Base):
    __tablename__ = "requisiciones_detalle"

    id = Column(Integer, primary_key=True, index=True)
    requisicion_id = Column(Integer, ForeignKey("requisiciones.id", ondelete="CASCADE"), nullable=False)
    material_solicitado = Column(String(300), nullable=False)
    cantidad_solicitada = Column(Float, default=0.0)
    unidad = Column(String(20), default="")
    cantidad_recibida = Column(Float, default=0.0)
    material_id = Column(Integer, ForeignKey("materiales.id", ondelete="SET NULL"), nullable=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="SET NULL"), nullable=True)

    requisicion = relationship("Requisicion", back_populates="detalles")
    material = relationship("Material")
    factura = relationship("Factura")
