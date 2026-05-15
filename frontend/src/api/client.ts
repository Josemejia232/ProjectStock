import axios from 'axios'
import type {
  Proyecto, ProyectoForm, Material, MaterialForm,
  Inventario, InventarioForm, Movimiento, MovimientoForm,
  Factura, FacturaForm,
  Dashboard, Alerta, AlertaPrecio, ResumenInsumo,
  InsumoPorProyecto,
  Requisicion, RequisicionForm, RecibirForm, RequisicionDetalle,
} from '../types'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })

export const proyectosApi = {
  list: () => api.get<Proyecto[]>('/proyectos/').then(r => r.data),
  get: (id: number) => api.get<Proyecto>(`/proyectos/${id}`).then(r => r.data),
  create: (d: ProyectoForm) => api.post<Proyecto>('/proyectos/', d).then(r => r.data),
  update: (id: number, d: Partial<ProyectoForm>) => api.put<Proyecto>(`/proyectos/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/proyectos/${id}`),
}

export const inventarioApi = {
  list: (proyecto_id?: number) =>
    api.get<Inventario[]>('/inventario/', { params: { proyecto_id } }).then(r => r.data),
  get: (id: number) => api.get<Inventario>(`/inventario/${id}`).then(r => r.data),
  create: (d: InventarioForm) => api.post<Inventario>('/inventario/', d).then(r => r.data),
  update: (id: number, d: Partial<InventarioForm>) =>
    api.put<Inventario>(`/inventario/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/inventario/${id}`),
}

export const movimientosApi = {
  list: (params?: { proyecto_id?: number; material_id?: number; tipo?: string; categoria?: string }) =>
    api.get<Movimiento[]>('/movimientos/', { params }).then(r => r.data),
  get: (id: number) => api.get<Movimiento>(`/movimientos/${id}`).then(r => r.data),
  create: (d: MovimientoForm) => api.post<Movimiento>('/movimientos/', d).then(r => r.data),
  update: (id: number, d: Partial<MovimientoForm>) => api.put<Movimiento>(`/movimientos/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/movimientos/${id}`),
}

export const materialesApi = {
  list: () => api.get<Material[]>('/materiales/').then(r => r.data),
  get: (id: number) => api.get<Material>(`/materiales/${id}`).then(r => r.data),
  create: (d: MaterialForm) => api.post<Material>('/materiales/', d).then(r => r.data),
  update: (id: number, d: Partial<MaterialForm>) => api.put<Material>(`/materiales/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/materiales/${id}`),
  descargarPlantilla: () => api.get('/materiales/plantilla', { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'plantilla_insumos.xlsx'; a.click();
    window.URL.revokeObjectURL(url);
  }),
  cargarExcel: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post<{ creados: number; omitidos: number }>('/materiales/cargar', fd).then(r => r.data);
  },
}

export const facturasApi = {
  list: () => api.get<Factura[]>('/facturas/').then(r => r.data),
  get: (id: number) => api.get<Factura>(`/facturas/${id}`).then(r => r.data),
  create: (d: FacturaForm) => api.post<Factura>('/facturas/', d).then(r => r.data),
  update: (id: number, d: Partial<FacturaForm>) => api.put<Factura>(`/facturas/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/facturas/${id}`),
}

export const requisicionesApi = {
  list: (proyecto_id?: number) =>
    api.get<Requisicion[]>('/requisiciones/', { params: { proyecto_id } }).then(r => r.data),
  create: (d: RequisicionForm) => api.post<Requisicion>('/requisiciones/', d).then(r => r.data),
  update: (id: number, d: Partial<RequisicionForm>) => api.put<Requisicion>(`/requisiciones/${id}`, d).then(r => r.data),
  remove: (id: number) => api.delete(`/requisiciones/${id}`),
  recibir: (detalle_id: number, d: RecibirForm) => api.post<RequisicionDetalle>(`/requisiciones/recibir/${detalle_id}`, d).then(r => r.data),
  actualizarRecibir: (detalle_id: number, d: RecibirForm) => api.put<RequisicionDetalle>(`/requisiciones/recibir/${detalle_id}`, d).then(r => r.data),
}

export const reportesApi = {
  dashboard: () => api.get<Dashboard>('/reportes/dashboard').then(r => r.data),
  alertas: () => api.get<Alerta[]>('/reportes/alertas').then(r => r.data),
  alertasPrecios: () => api.get<AlertaPrecio[]>('/reportes/alertas-precios').then(r => r.data),
  resumenInsumos: (proyecto_id?: number) =>
    api.get<ResumenInsumo[]>('/reportes/resumen-insumos', { params: { proyecto_id } }).then(r => r.data),
  movimientosPorMes: () => api.get('/reportes/movimientos-por-mes').then(r => r.data),
  insumosPorProyecto: () => api.get<InsumoPorProyecto>('/reportes/insumos-por-proyecto').then(r => r.data),
}
