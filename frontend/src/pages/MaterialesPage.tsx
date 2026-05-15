import { useEffect, useState, useMemo, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { materialesApi } from '../api/client'
import type { Material, MaterialForm } from '../types'

const CATEGORIAS = ['Concreto', 'Acero', 'Agregados', 'Mampostería', 'Acabados', 'Hidrosanitaria', 'Eléctrico', 'Madera', 'Ferretería']

export default function MaterialesPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<MaterialForm>({ nombre: '', unidad_medida: '', categoria: 'General', precio_unitario: 0, proveedor: '' })
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    materialesApi.list().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(m =>
      m.nombre.toLowerCase().includes(q) ||
      (m.proveedor || '').toLowerCase().includes(q) ||
      m.categoria.toLowerCase().includes(q)
    )
  }, [items, search])

  const grouped = useMemo(() => {
    const map: Record<string, Material[]> = {}
    for (const m of filtered) {
      const cat = m.categoria
      if (!map[cat]) map[cat] = []
      map[cat].push(m)
    }
    const sorted = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    return sorted
  }, [filtered])

  const handleSubmit = async () => {
    if (editing) {
      await materialesApi.update(editing, form)
    } else {
      await materialesApi.create(form)
    }
    setForm({ nombre: '', unidad_medida: '', categoria: 'General', precio_unitario: 0, proveedor: '' })
    setEditing(null); setShowForm(false); load()
  }

  const handleEdit = (item: Material) => {
    setForm({ nombre: item.nombre, unidad_medida: item.unidad_medida, categoria: item.categoria, precio_unitario: item.precio_unitario, proveedor: item.proveedor || '' })
    setEditing(item.id); setShowForm(true)
  }

  const handleDelete = async (item: Material) => {
    if (!confirm(t('confirmar_eliminar'))) return
    await materialesApi.remove(item.id); load()
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await materialesApi.cargarExcel(file)
      load()
      if (res.omitidos > 0) {
        alert(`Se cargaron ${res.creados} insumo(s). ${res.omitidos} ya existían en el sistema y fueron omitidos.`)
      } else {
        alert(`Se cargaron ${res.creados} insumo(s) exitosamente.`)
      }
    } catch (_e) {
      alert('Error al cargar el archivo. Verifica el formato.')
    }
    e.target.value = ''
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">{t('materiales')}</h2>
          <p className="text-sm lg:text-base text-slate-500 mt-1">{'Catálogo maestro de insumos'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => materialesApi.descargarPlantilla()} className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 border border-slate-200 rounded-lg text-xs lg:text-sm hover:bg-slate-50 transition-all">
            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            <span className="hidden sm:inline">Plantilla</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 lg:px-4 py-2 lg:py-2.5 bg-black text-white rounded-lg text-xs lg:text-sm hover:bg-slate-800 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            <span className="hidden sm:inline">Cargar Excel</span>
            <input type="file" accept=".xlsx" className="hidden" onChange={handleExcelUpload} />
          </label>
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ nombre: '', unidad_medida: '', categoria: 'General', precio_unitario: 0, proveedor: '' }) }} className="flex items-center gap-2 px-3 lg:px-5 py-2 lg:py-2.5 bg-black text-white rounded-lg text-xs lg:text-sm hover:bg-slate-800 transition-all">
            <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t('nuevo')}
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, proveedor o categoría..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition-colors" />
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="border border-slate-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2">
            <h3 className="text-base">{editing ? t('editar_material') : t('nuevo_material')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs ml-1">{t('insumo') || 'Insumo'}</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs ml-1">{t('unidad_medida')}</label>
              <input value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs ml-1">{t('valor') || 'Valor'}</label>
              <input type="number" step="0.01" value={form.precio_unitario} onChange={(e) => setForm({ ...form, precio_unitario: +e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs ml-1">{t('proveedor')}</label>
              <input value={form.proveedor || ''} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs ml-1">{t('categoria')}</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-all">{t('guardar')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Insumo</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Un</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider hidden lg:table-cell">Proveedor</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider w-16 lg:w-20">Acc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1,2,3,4,5,6].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
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
        <div className="modern-card overflow-hidden border-none shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('fecha') || 'Fecha'}</th>
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('insumo') || 'Insumo'}</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">Un</th>
                  <th className="text-right px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('valor') || 'Valor'}</th>
                  <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider hidden lg:table-cell">{t('proveedor')}</th>
                  <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider w-16 lg:w-20">{t('acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grouped.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 lg:px-6 py-8 lg:py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <p className="text-slate-500 font-medium">{search ? 'Sin resultados para esta búsqueda' : t('sin_datos')}</p>
                      </div>
                    </td>
                  </tr>
                ) : grouped.map(([categoria, mats], gi) => (
                  <Fragment key={categoria}>
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-3 lg:px-6 py-2">
                        <span className="text-xs uppercase tracking-wider">{categoria}</span>
                        <span className="ml-2 text-xs">{mats.length}</span>
                      </td>
                    </tr>
                    {mats.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-xs">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '-'}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-sm">{m.nombre}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-center"><span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] uppercase">{m.unidad_medida}</span></td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-right text-sm">${m.precio_unitario.toFixed(2)}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-sm hidden lg:table-cell">{m.proveedor || '-'}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-center w-16 lg:w-20">
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => handleEdit(m)} className="p-1 hover:text-indigo-600 transition-colors" title={t('editar')}>
                              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(m)} className="p-1 hover:text-rose-600 transition-colors" title={t('eliminar')}>
                              <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
