from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from app.models import EstadoProyecto, TipoMovimiento


class ProyectoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: str = ""
    ubicacion: str = ""
    responsable: str = ""
    email: str = ""
    movil: str = ""
    estado: str = EstadoProyecto.EJECUCION.value


class ProyectoCreate(ProyectoBase):
    pass


class ProyectoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    ubicacion: Optional[str] = None
    responsable: Optional[str] = None
    email: Optional[str] = None
    movil: Optional[str] = None
    estado: Optional[str] = None


class ProyectoOut(ProyectoBase):
    id: int
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    unidad_medida: str = Field(..., min_length=1, max_length=20)
    categoria: str = "General"
    precio_unitario: float = 0.0
    proveedor: str = ""


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    nombre: Optional[str] = None
    unidad_medida: Optional[str] = None
    categoria: Optional[str] = None
    precio_unitario: Optional[float] = None
    proveedor: Optional[str] = None


class MaterialOut(MaterialBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventarioBase(BaseModel):
    proyecto_id: int
    material_id: int
    cantidad_actual: float = 0.0
    cantidad_minima: float = 0.0
    cantidad_maxima: float = 0.0


class InventarioCreate(InventarioBase):
    pass


class InventarioUpdate(BaseModel):
    cantidad_minima: Optional[float] = None
    cantidad_maxima: Optional[float] = None


class InventarioOut(InventarioBase):
    id: int
    updated_at: Optional[datetime] = None
    proyecto_nombre: Optional[str] = None
    material_nombre: Optional[str] = None
    material_unidad: Optional[str] = None

    class Config:
        from_attributes = True


class MovimientoBase(BaseModel):
    proyecto_id: int
    material_id: int
    tipo: str
    cantidad: float = Field(..., gt=0)
    descripcion: str = ""
    usuario: str = ""
    no_remision: str = ""
    categoria: str = "normal"


class MovimientoCreate(MovimientoBase):
    pass


class MovimientoUpdate(BaseModel):
    proyecto_id: Optional[int] = None
    material_id: Optional[int] = None
    tipo: Optional[str] = None
    cantidad: Optional[float] = None
    descripcion: Optional[str] = None
    usuario: Optional[str] = None
    no_remision: Optional[str] = None
    categoria: Optional[str] = None
    fecha: Optional[datetime] = None


class MovimientoOut(MovimientoBase):
    id: int
    fecha: Optional[datetime] = None
    proyecto_nombre: Optional[str] = None
    material_nombre: Optional[str] = None
    material_unidad: Optional[str] = None

    class Config:
        from_attributes = True


class FacturaBase(BaseModel):
    fecha: Optional[datetime] = None
    no_factura: str = Field(..., min_length=1, max_length=100)
    proveedor: str = ""
    insumo: str = ""
    valor: float = 0.0


class FacturaCreate(FacturaBase):
    pass


class FacturaUpdate(BaseModel):
    fecha: Optional[datetime] = None
    no_factura: Optional[str] = None
    proveedor: Optional[str] = None
    insumo: Optional[str] = None
    valor: Optional[float] = None


class FacturaOut(FacturaBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RequisicionDetalleOut(BaseModel):
    id: int
    requisicion_id: int
    material_solicitado: str
    cantidad_solicitada: float
    unidad: str
    cantidad_recibida: float
    material_id: Optional[int] = None
    material_nombre: Optional[str] = None
    factura_id: Optional[int] = None
    factura_no: Optional[str] = None

    class Config:
        from_attributes = True


class RequisicionOut(BaseModel):
    id: int
    proyecto_id: int
    proyecto_nombre: Optional[str] = None
    residente: str
    no_requisicion: str = ""
    destino_uso: str = ""
    aprobado_por: str = ""
    elaborado_por: str = ""
    fecha_solicitud: Optional[datetime] = None
    estado: str
    detalles: List[RequisicionDetalleOut] = []

    class Config:
        from_attributes = True


class RequisicionCreate(BaseModel):
    proyecto_id: int
    residente: str = ""
    no_requisicion: str = ""
    destino_uso: str = ""
    aprobado_por: str = ""
    elaborado_por: str = ""
    detalles: List["RequisicionDetalleCreate"] = []


class RequisicionDetalleCreate(BaseModel):
    material_solicitado: str
    cantidad_solicitada: float = 0.0
    unidad: str = ""


class RequisicionUpdate(BaseModel):
    residente: Optional[str] = None
    no_requisicion: Optional[str] = None
    destino_uso: Optional[str] = None
    aprobado_por: Optional[str] = None
    elaborado_por: Optional[str] = None
    detalles: Optional[List[RequisicionDetalleCreate]] = None


class RecibirDetalleRequest(BaseModel):
    material_id: int
    cantidad_recibida: float = Field(..., gt=0)
    factura_id: Optional[int] = None


class AlertaOut(BaseModel):
    inventario_id: int
    proyecto_id: int
    proyecto_nombre: str
    material_id: int
    material_nombre: str
    material_unidad: str
    cantidad_actual: float
    cantidad_minima: float
    cantidad_maxima: float
    tipo_alerta: str


class AlertaPrecioOut(BaseModel):
    id: int
    material_id: int
    material_nombre: str
    proveedor: str
    precio_anterior: float
    precio_nuevo: float
    diferencia: float
    fecha: datetime


class ResumenInsumoOut(BaseModel):
    material_id: int
    material_nombre: str
    unidad_medida: str
    entradas: float
    salidas: float
    stock: float


class InsumoPorProyectoItem(BaseModel):
    material_id: int
    material_nombre: str
    unidad_medida: str
    cantidades: Dict[str, float]
    total: float


class InsumoPorProyectoOut(BaseModel):
    proyectos: List[str]
    insumos: List[InsumoPorProyectoItem]


class DashboardOut(BaseModel):
    total_proyectos: int
    proyectos_activos: int
    total_materiales: int
    total_movimientos: int
    alertas: List[AlertaOut]
    excedentes: int
    faltantes: int
    stock_critico: int


class UsuarioSync(BaseModel):
    supabase_id: str
    email: str
    nombre: str


class UsuarioOut(BaseModel):
    id: int
    supabase_id: str
    email: str
    nombre: str
    rol: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
