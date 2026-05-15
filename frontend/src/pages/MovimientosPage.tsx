import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { movimientosApi, proyectosApi, materialesApi } from '../api/client'
import type { Movimiento, MovimientoForm, Proyecto, Material } from '../types'
import DataTable from '../components/DataTable'

export default function MovimientosPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Movimiento[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<MovimientoForm>({ proyecto_id: 0, material_id: 0, tipo: 'entrada', cantidad: 1, descripcion: '', usuario: '', no_remision: '', categoria: 'normal' })
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [tipoFilter, setTipoFilter] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [proyectoFilter, setProyectoFilter] = useState<number | ''>('')

  const filtered = useMemo(() => {
    let result = items
    if (tipoFilter) result = result.filter(m => m.tipo === tipoFilter)
    if (categoriaFilter) result = result.filter(m => (m.categoria || 'normal') === categoriaFilter)
    if (proyectoFilter) result = result.filter(m => m.proyecto_id === proyectoFilter)
    return result
  }, [items, tipoFilter, categoriaFilter, proyectoFilter])

  const load = async () => {
    setLoading(true)
    try {
      const [movs, pros, mats] = await Promise.all([
        movimientosApi.list(),
        proyectosApi.list(),
        materialesApi.list(),
      ])
      setItems(movs); setProyectos(pros); setMateriales(mats)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (editing) {
      await movimientosApi.update(editing, form)
    } else {
      await movimientosApi.create(form)
    }
    setForm({ proyecto_id: 0, material_id: 0, tipo: 'entrada', cantidad: 1, descripcion: '', usuario: '', no_remision: '', categoria: 'normal' })
    setEditing(null); setShowForm(false); load()
  }

  const handleEdit = (item: Movimiento) => {
    setForm({
      proyecto_id: item.proyecto_id,
      material_id: item.material_id,
      tipo: item.tipo,
      cantidad: item.cantidad,
      descripcion: item.descripcion,
      usuario: item.usuario,
      no_remision: item.no_remision || '',
      categoria: item.categoria || 'normal',
    })
    setEditing(item.id); setShowForm(true)
  }

  const handleDelete = async (item: Movimiento) => {
    if (!confirm(t('confirmar_eliminar'))) return
    await movimientosApi.remove(item.id); load()
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (tipoFilter) params.set('tipo', tipoFilter)
    if (proyectoFilter) params.set('proyecto_id', String(proyectoFilter))
    const url = `/api/movimientos/exportar${params.toString() ? '?' + params.toString() : ''}`
    window.open(url, '_blank')
  }

  const categoriaStyles: Record<string, string> = {
    normal: 'bg-slate-100 text-slate-600',
    devolucion: 'bg-rose-100 text-rose-700',
    sobrante: 'bg-emerald-100 text-emerald-700',
    ajuste: 'bg-amber-100 text-amber-700',
  }

  const columns = [
    {
      key: 'fecha',
      label: t('fecha'),
      render: (v: string) => (
        <span>{v ? new Date(v).toLocaleDateString() : '-'}</span>
      ),
    },
    {
      key: 'no_remision',
      label: t('no_remision') || 'No. Remisión',
      render: (v: string) => <span className="font-mono">{v || '-'}</span>,
    },
    {
      key: 'material_nombre',
      label: t('insumo') || 'Insumo',
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      key: 'cantidad',
      label: t('cantidad'),
      render: (v: number) => <span>{v}</span>,
    },
    {
      key: 'material_unidad',
      label: t('unidad') || 'Unidad',
      render: (v: string) => <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] uppercase">{v || '-'}</span>,
    },
    {
      key: 'categoria',
      label: t('categoria') || 'Categoría',
      render: (v: string) => {
        const cat = v || 'normal'
        return (
          <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${categoriaStyles[cat] || ''}`}>
            {t('categoria_' + cat) || cat}
          </span>
        )
      },
    },
    {
      key: 'descripcion',
      label: t('descripcion'),
      render: (v: string) => <span className="truncate max-w-[200px] inline-block">{v || '-'}</span>,
    },
    {
      key: 'tipo',
      label: t('tipo'),
      render: (v: string) => (
        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${v === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {t(v)}
        </span>
      ),
    },
    {
      key: 'proyecto_nombre',
      label: t('proyecto'),
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      key: 'usuario',
      label: t('usuario'),
      render: (v: string) => <span>{v || '-'}</span>,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('movimientos')}</h2>
          <p className="text-slate-500 mt-1">{'Historial de entradas y salidas'}</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ proyecto_id: 0, material_id: 0, tipo: 'entrada', cantidad: 1, descripcion: '', usuario: '', no_remision: '', categoria: 'normal' }) }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('nuevo')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 bg-emerald-600 text-white rounded-lg text-xs lg:text-sm hover:bg-emerald-700 transition-all">
          <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exportar Excel
        </button>
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="appearance-none px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none">
          <option value="">{t('todos_tipos') || 'Todos los Tipos'}</option>
          <option value="entrada">{t('entrada')}</option>
          <option value="salida">{t('salida')}</option>
        </select>
        <select value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className="appearance-none px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none">
          <option value="">{t('todas_categorias') || 'Todas las Categorías'}</option>
          <option value="normal">{t('categoria_normal') || 'Normal'}</option>
          <option value="devolucion">{t('categoria_devolucion') || 'Devolución'}</option>
          <option value="sobrante">{t('categoria_sobrante') || 'Sobrante'}</option>
          <option value="ajuste">{t('categoria_ajuste') || 'Ajuste'}</option>
        </select>
        <select value={proyectoFilter} onChange={(e) => setProyectoFilter(e.target.value ? +e.target.value : '')} className="appearance-none px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none">
          <option value="">{t('todos_proyectos') || 'Todos los Proyectos'}</option>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="modern-card p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{editing ? t('editar_movimiento') || 'Editar Movimiento' : t('nuevo_movimiento') || 'Nuevo Movimiento'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('fecha')}</label>
              <input type="date" value={form.fecha ? form.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('no_remision') || 'No. Remisión'}</label>
              <input value={form.no_remision || ''} onChange={(e) => setForm({ ...form, no_remision: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('categoria') || 'Categoría'}</label>
              <select value={form.categoria || 'normal'} onChange={(e) => {
                const cat = e.target.value
                const tipo = cat === 'devolucion' ? 'salida' : cat === 'sobrante' ? 'entrada' : form.tipo
                const desc = cat === 'devolucion' ? 'Devolución a proveedor' : cat === 'sobrante' ? 'Sobrante de obra' : cat === 'ajuste' ? 'Ajuste de inventario' : form.descripcion
                setForm({ ...form, categoria: cat, tipo: tipo as 'entrada' | 'salida', descripcion: !editing ? desc : form.descripcion })
              }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="normal">{t('categoria_normal') || 'Normal'}</option>
                <option value="devolucion">{t('categoria_devolucion') || 'Devolución'}</option>
                <option value="sobrante">{t('categoria_sobrante') || 'Sobrante'}</option>
                <option value="ajuste">{t('categoria_ajuste') || 'Ajuste'}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('tipo')}</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'entrada' | 'salida' })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <option value="entrada">{t('entrada')}</option>
                <option value="salida">{t('salida')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('proyecto')}</label>
              <select value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required>
                <option value="0">{t('seleccionar')}</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('insumo') || 'Insumo'}</label>
              <select value={form.material_id} onChange={(e) => setForm({ ...form, material_id: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required>
                <option value="0">{t('seleccionar')}</option>
                {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('cantidad')}</label>
              <input type="number" step="0.01" min="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('usuario')}</label>
              <input value={form.usuario || ''} onChange={(e) => setForm({ ...form, usuario: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('descripcion')}</label>
              <input value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all">{t('guardar')}</button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={filtered} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}
