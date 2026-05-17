export interface Proyecto {
  id: number
  nombre: string
  descripcion: string
  ubicacion: string
  responsable?: string
  email?: string
  movil?: string
  estado: 'ejecucion' | 'pausado' | 'finalizado'
  fecha_inicio?: string
  fecha_fin?: string
  created_at?: string
  updated_at?: string
}

export interface ProyectoForm {
  nombre: string
  descripcion?: string
  ubicacion?: string
  responsable?: string
  email?: string
  movil?: string
  estado?: string
}

export interface Material {
  id: number
  nombre: string
  unidad_medida: string
  categoria: string
  precio_unitario: number
  proveedor?: string
  created_at?: string
}

export interface MaterialForm {
  nombre: string
  unidad_medida: string
  categoria?: string
  precio_unitario?: number
  proveedor?: string
}

export interface Inventario {
  id: number
  proyecto_id: number
  material_id: number
  cantidad_actual: number
  cantidad_minima: number
  cantidad_maxima: number
  updated_at?: string
  proyecto_nombre?: string
  material_nombre?: string
  material_unidad?: string
}

export interface InventarioForm {
  proyecto_id: number
  material_id: number
  cantidad_actual?: number
  cantidad_minima?: number
  cantidad_maxima?: number
}

export interface Movimiento {
  id: number
  proyecto_id: number
  material_id: number
  tipo: 'entrada' | 'salida'
  cantidad: number
  descripcion: string
  usuario: string
  no_remision?: string
  categoria?: string
  fecha?: string
  proyecto_nombre?: string
  material_nombre?: string
  material_unidad?: string
}

export interface MovimientoForm {
  proyecto_id: number
  material_id: number
  tipo: 'entrada' | 'salida'
  cantidad: number
  descripcion?: string
  usuario?: string
  no_remision?: string
  categoria?: string
}

export interface Factura {
  id: number
  fecha?: string
  no_factura: string
  proveedor: string
  insumo: string
  valor: number
  created_at?: string
}

export interface FacturaForm {
  fecha?: string
  no_factura: string
  proveedor?: string
  insumo?: string
  valor?: number
}

export interface Alerta {
  inventario_id: number
  proyecto_id: number
  proyecto_nombre: string
  material_id: number
  material_nombre: string
  material_unidad: string
  cantidad_actual: number
  cantidad_minima: number
  cantidad_maxima: number
  tipo_alerta: 'excedente' | 'faltante' | 'stock_critico'
}

export interface AlertaPrecio {
  id: number
  material_id: number
  material_nombre: string
  proveedor: string
  precio_anterior: number
  precio_nuevo: number
  diferencia: number
  fecha: string
}

export interface RequisicionDetalle {
  id: number
  requisicion_id: number
  material_solicitado: string
  cantidad_solicitada: number
  unidad: string
  cantidad_recibida: number
  material_id?: number
  material_nombre?: string
  factura_id?: number
  factura_no?: string
}

export interface Requisicion {
  id: number
  proyecto_id: number
  proyecto_nombre?: string
  residente: string
  no_requisicion?: string
  destino_uso?: string
  aprobado_por?: string
  elaborado_por?: string
  fecha_solicitud?: string
  estado: 'pendiente' | 'parcial' | 'completada'
  detalles: RequisicionDetalle[]
}

export interface RequisicionForm {
  proyecto_id: number
  residente: string
  destino_uso?: string
  aprobado_por?: string
  elaborado_por?: string
  fecha_solicitud?: string
  detalles: { material_solicitado: string; cantidad_solicitada: number; unidad: string }[]
}

export interface RecibirForm {
  material_id: number
  cantidad_recibida: number
  factura_id?: number
}

export interface ResumenInsumo {
  material_id: number
  material_nombre: string
  unidad_medida: string
  entradas: number
  salidas: number
  stock: number
}

export interface InsumoPorProyectoItem {
  material_id: number
  material_nombre: string
  unidad_medida: string
  cantidades: Record<string, number>
  total: number
}

export interface InsumoPorProyecto {
  proyectos: string[]
  insumos: InsumoPorProyectoItem[]
}

export interface Dashboard {
  total_proyectos: number
  proyectos_activos: number
  total_materiales: number
  total_movimientos: number
  alertas: Alerta[]
  excedentes: number
  faltantes: number
  stock_critico: number
}

export interface Usuario {
  id: number
  supabase_id: string
  email: string
  nombre: string
  rol: string
  created_at?: string
}
