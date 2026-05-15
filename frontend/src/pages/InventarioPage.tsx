import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { proyectosApi, reportesApi, materialesApi } from '../api/client'
import type { Proyecto, ResumenInsumo, Material } from '../types'

export default function InventarioPage() {
  const { t } = useTranslation()
  const [resumen, setResumen] = useState<ResumenInsumo[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [proyectoFilter, setProyectoFilter] = useState<number | ''>('')
  const [categoriaFilter, setCategoriaFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [pros, res, mats] = await Promise.all([
        proyectosApi.list(),
        reportesApi.resumenInsumos(proyectoFilter || undefined),
        materialesApi.list(),
      ])
      setProyectos(pros); setResumen(res); setMateriales(mats)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [proyectoFilter])

  const categorias = useMemo(() => {
    const cats = new Set(materiales.map(m => m.categoria))
    return Array.from(cats).sort()
  }, [materiales])

  const matByCat = useMemo(() => {
    const map: Record<string, Set<number>> = {}
    for (const m of materiales) {
      if (!map[m.categoria]) map[m.categoria] = new Set()
      map[m.categoria].add(m.id)
    }
    return map
  }, [materiales])

  const filtered = useMemo(() => {
    if (!categoriaFilter) return resumen
    const ids = matByCat[categoriaFilter]
    if (!ids) return []
    return resumen.filter(r => ids.has(r.material_id))
  }, [resumen, categoriaFilter, matByCat])

  const handleExport = () => {
    const params = new URLSearchParams()
    if (proyectoFilter) params.set('proyecto_id', String(proyectoFilter))
    const url = `/api/reportes/exportar-insumos${params.toString() ? '?' + params.toString() : ''}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">{t('inventario')}</h2>
          <p className="text-sm lg:text-base text-slate-500 mt-1">{'Control de stock por proyecto'}</p>
        </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 bg-emerald-600 text-white rounded-lg text-xs lg:text-sm hover:bg-emerald-700 transition-all">
              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Exportar Excel
            </button>
          <div className="relative">
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">{t('todas_categorias') || 'Todas las Categorías'}</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="relative">
            <select
              value={proyectoFilter}
              onChange={(e) => setProyectoFilter(e.target.value ? +e.target.value : '')}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="">{t('todos_proyectos') || 'Todos los Proyectos'}</option>
              {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Insumo</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Un</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Entradas</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Salidas</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1,2,3,4,5,6].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j} className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${30 + Math.random() * 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('insumo') || 'Insumo'}</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Un</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('entradas')}</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('salidas')}</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('stock')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.material_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-sm">{r.material_nombre}</td>
                    <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-center"><span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] uppercase">{r.unidad_medida}</span></td>
                    <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-right text-sm text-emerald-600 font-medium">{r.entradas.toFixed(0)}</td>
                    <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-right text-sm text-red-600 font-medium">{r.salidas.toFixed(0)}</td>
                    <td className={`px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-right text-sm ${r.stock < 0 ? 'text-red-600 font-bold' : ''}`}>{r.stock < 0 ? `(${Math.abs(r.stock).toFixed(0)})` : r.stock.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
