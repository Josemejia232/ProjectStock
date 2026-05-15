import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { facturasApi, movimientosApi, materialesApi, proyectosApi } from '../api/client'
import type { Factura, FacturaForm, Material, Proyecto } from '../types'
import DataTable from '../components/DataTable'

export default function FacturasPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Factura[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FacturaForm>({ no_factura: '', proveedor: '', insumo: '', valor: 0, fecha: new Date().toISOString().slice(0, 10) })
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [entradaSource, setEntradaSource] = useState<Factura | null>(null)
  const [entradaForm, setEntradaForm] = useState({ material_id: 0, cantidad: 1, proyecto_id: 0 })

  const load = () => {
    setLoading(true)
    Promise.all([
      facturasApi.list().then(setItems),
      materialesApi.list().then(setMateriales),
      proyectosApi.list().then(setProyectos),
    ]).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async () => {
    const payload = {
      ...form,
      fecha: form.fecha ? new Date(form.fecha).toISOString() : undefined,
    }
    if (editing) {
      await facturasApi.update(editing, payload)
    } else {
      await facturasApi.create(payload as FacturaForm)
    }
    setForm({ no_factura: '', proveedor: '', insumo: '', valor: 0, fecha: new Date().toISOString().slice(0, 10) })
    setEditing(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (item: Factura) => {
    setForm({
      no_factura: item.no_factura,
      proveedor: item.proveedor,
      insumo: item.insumo,
      valor: item.valor,
      fecha: item.fecha ? item.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
    })
    setEditing(item.id)
    setShowForm(true)
  }

  const handleDelete = async (item: Factura) => {
    if (!confirm(t('confirmar_eliminar'))) return
    await facturasApi.remove(item.id)
    load()
  }

  const handleStartEntrada = (factura: Factura) => {
    setEntradaSource(factura)
    setEntradaForm({ material_id: 0, cantidad: 1, proyecto_id: 0 })
  }

  const handleConfirmarEntrada = async () => {
    if (!entradaSource || !entradaForm.material_id || !entradaForm.proyecto_id) return
    await movimientosApi.create({
      proyecto_id: entradaForm.proyecto_id,
      material_id: entradaForm.material_id,
      tipo: 'entrada',
      cantidad: entradaForm.cantidad,
      descripcion: `Factura ${entradaSource.no_factura} — ${entradaSource.proveedor}`,
      usuario: 'Admin',
    })
    setEntradaSource(null)
    load()
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (v: number) => <span className="font-mono text-xs text-slate-400">#{v}</span>,
    },
    {
      key: 'fecha',
      label: t('fecha'),
      render: (v: string) => (
        <span className="text-slate-600 font-medium">
          {v ? new Date(v).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'no_factura',
      label: t('no_factura'),
      render: (v: string) => <span className="font-mono font-bold text-slate-800">{v}</span>,
    },
    {
      key: 'proveedor',
      label: t('proveedor'),
      render: (v: string) => <span className="text-slate-600">{v || '-'}</span>,
    },
    {
      key: 'insumo',
      label: t('insumo'),
      render: (v: string) => <span className="text-slate-500">{v || '-'}</span>,
    },
    {
      key: 'valor',
      label: t('valor'),
      render: (v: number) => (
        <span className="font-semibold text-emerald-600">${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('facturas')}</h2>
          <p className="text-slate-500 mt-1">{t('facturas_subtitle') || 'Registro de facturas de compras'}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ no_factura: '', proveedor: '', insumo: '', valor: 0, fecha: new Date().toISOString().slice(0, 10) }) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('nuevo')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="modern-card p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{editing ? t('editar_factura') : t('nueva_factura')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('fecha')}</label>
              <input type="date" value={form.fecha?.slice(0, 10) || ''} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('no_factura')}</label>
              <input value={form.no_factura} onChange={(e) => setForm({ ...form, no_factura: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('proveedor')}</label>
              <input value={form.proveedor || ''} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('insumo')}</label>
              <input value={form.insumo || ''} onChange={(e) => setForm({ ...form, insumo: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('valor')}</label>
              <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all">{t('guardar')}</button>
          </div>
        </form>
      )}

      {entradaSource && (
        <form onSubmit={(e) => { e.preventDefault(); handleConfirmarEntrada() }} className="modern-card p-6 space-y-6 animate-fade-in border-l-4 border-emerald-500">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Generar Entrada — Factura {entradaSource.no_factura}</h3>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-400 mr-2">{t('proveedor')}:</span>
              <span className="font-medium text-slate-700">{entradaSource.proveedor || '-'}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-400 mr-2">{t('insumo')}:</span>
              <span className="font-medium text-slate-700">{entradaSource.insumo || '-'}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-400 mr-2">{t('valor')}:</span>
              <span className="font-semibold text-emerald-600">${entradaSource.valor.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('material')}</label>
              <select value={entradaForm.material_id} onChange={(e) => setEntradaForm({ ...entradaForm, material_id: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" required>
                <option value="0">{t('seleccionar_material')}</option>
                {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('cantidad')}</label>
              <input type="number" step="0.01" min="0.01" value={entradaForm.cantidad} onChange={(e) => setEntradaForm({ ...entradaForm, cantidad: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('proyecto')}</label>
              <select value={entradaForm.proyecto_id} onChange={(e) => setEntradaForm({ ...entradaForm, proyecto_id: +e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" required>
                <option value="0">{t('seleccionar_proyecto')}</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEntradaSource(null)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all">Confirmar Entrada</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {[1,2,3,4,5,6].map(i => <th key={i} className="px-3 lg:px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-16" /></th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1,2,3,4].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-3 lg:px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${30 + Math.random() * 40}%` }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="modern-card overflow-hidden border-none shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {columns.map((col) => (
                      <th key={col.key} className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                        {col.label}
                      </th>
                    ))}
                    <th className="text-center px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('acciones')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {col.render ? col.render(row[col.key as keyof Factura], row) : <span className="font-medium text-slate-700">{String(row[col.key as keyof Factura] ?? '-')}</span>}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleStartEntrada(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Entrada
                          </button>
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title={t('editar')}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(row)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title={t('eliminar')}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
