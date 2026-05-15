import { useEffect, useState, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { requisicionesApi, proyectosApi, materialesApi, facturasApi } from '../api/client'
import type { Requisicion, RequisicionForm, Proyecto, Material, Factura } from '../types'

interface DetalleRow {
  material_solicitado: string
  cantidad_solicitada: number
  unidad: string
}

export default function RequisicionesPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Requisicion[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState<RequisicionForm>({ proyecto_id: 0, residente: '', destino_uso: '', aprobado_por: '', elaborado_por: '', detalles: [] })
  const [recibirId, setRecibirId] = useState<number | null>(null)
  const [recibirForm, setRecibirForm] = useState({ material_id: 0, cantidad_recibida: 1, factura_id: 0 })
  const [pdfLoading, setPdfLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [reqs, pros, mats, facts] = await Promise.all([
        requisicionesApi.list(),
        proyectosApi.list(),
        materialesApi.list(),
        facturasApi.list(),
      ])
      setItems(reqs); setProyectos(pros); setMateriales(mats); setFacturas(facts)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ proyecto_id: proyectos[0]?.id || 0, residente: '', destino_uso: '', aprobado_por: '', elaborado_por: '', detalles: [{ material_solicitado: '', cantidad_solicitada: 1, unidad: '' }] })

  const addDetalleRow = () => setForm({ ...form, detalles: [...form.detalles, { material_solicitado: '', cantidad_solicitada: 1, unidad: '' }] })

  const updateDetalle = (i: number, field: keyof DetalleRow, value: string | number) => {
    const d = [...form.detalles]; d[i] = { ...d[i], [field]: value }; setForm({ ...form, detalles: d })
  }

  const removeDetalle = (i: number) => setForm({ ...form, detalles: form.detalles.filter((_, idx) => idx !== i) })

  const handleSubmit = async () => {
    const payload = {
      ...form,
      fecha_solicitud: form.fecha_solicitud ? new Date(form.fecha_solicitud).toISOString() : undefined,
    }
    if (editing) {
      await requisicionesApi.update(editing, payload)
    } else {
      await requisicionesApi.create(payload)
    }
    setShowForm(false); setEditing(null); resetForm(); load()
  }

  const handleEdit = (item: Requisicion) => {
    setForm({
      proyecto_id: item.proyecto_id,
      residente: item.residente,
      destino_uso: item.destino_uso || '',
      aprobado_por: item.aprobado_por || '',
      elaborado_por: item.elaborado_por || '',
      detalles: item.detalles.map(d => ({ material_solicitado: d.material_solicitado, cantidad_solicitada: d.cantidad_solicitada, unidad: d.unidad })),
    })
    setEditing(item.id); setShowForm(true)
  }

  const handleDelete = async (item: Requisicion) => {
    if (!confirm(t('confirmar_eliminar'))) return
    await requisicionesApi.remove(item.id); load()
  }

  const downloadPdf = async (url: string, filename: string) => {
    setPdfLoading(true)
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al generar PDF')
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      alert('Error al generar PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleExportPdf = () => {
    downloadPdf('/api/requisiciones/exportar-pdf', 'requisiciones.pdf')
  }

  const handleExportPdfItem = (id: number) => {
    downloadPdf(`/api/requisiciones/${id}/pdf`, `requisicion_${id}.pdf`)
  }

  const handleRecibir = async (detalleId: number, mode: 'add' | 'save' = 'add') => {
    if (!recibirForm.material_id) return
    const api = mode === 'save' ? requisicionesApi.actualizarRecibir : requisicionesApi.recibir
    await api(detalleId, {
      material_id: recibirForm.material_id,
      cantidad_recibida: recibirForm.cantidad_recibida,
      factura_id: recibirForm.factura_id || undefined,
    })
    setRecibirId(null); load()
  }

  const estadoStyles: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
    parcial: 'bg-blue-100 text-blue-700 border-blue-200',
    completada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('requisiciones')}</h2>
          <p className="text-slate-500 mt-1">{t('requisiciones_subtitle') || 'Solicitudes de materiales a obra'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={pdfLoading} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 hover:bg-red-700 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
            {pdfLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            )}
            {pdfLoading ? (t('generando') || 'Generando...') : 'PDF'}
          </button>
          <button onClick={() => { setShowForm(!showForm); setEditing(null); resetForm() }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t('nueva_requisicion') || 'Nueva Requisición'}
        </button>
      </div>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="modern-card p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{editing ? t('editar_requisicion') || 'Editar Requisición' : t('nueva_requisicion') || 'Nueva Requisición'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('proyecto')}</label>
              <select value={form.proyecto_id} onChange={(e) => {
                  const pid = +e.target.value
                  const proy = proyectos.find(p => p.id === pid)
                  setForm({ ...form, proyecto_id: pid, residente: proy?.responsable || '' })
                }} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" required>
                <option value="0">{t('seleccionar')}</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('residente')}</label>
              <input value={form.residente} onChange={(e) => setForm({ ...form, residente: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('fecha')}</label>
              <input type="date" value={form.fecha_solicitud ? form.fecha_solicitud.slice(0, 10) : new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('destino_uso') || 'Destino / Uso'}</label>
              <input value={form.destino_uso || ''} onChange={(e) => setForm({ ...form, destino_uso: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Ej: Muros 2do piso" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('elaborado_por') || 'Elaborado por'}</label>
              <input value={form.elaborado_por || ''} onChange={(e) => setForm({ ...form, elaborado_por: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Nombre de quien elabora" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('aprobado_por') || 'Aprobado por'}</label>
              <input value={form.aprobado_por || ''} onChange={(e) => setForm({ ...form, aprobado_por: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Nombre de quien aprueba" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('detalles') || 'Detalles'}</label>
              <button type="button" onClick={addDetalleRow} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100">+ {t('agregar') || 'Agregar'}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 uppercase tracking-wider text-[10px]">{t('material_solicitado') || 'Material Solicitado'}</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 uppercase tracking-wider text-[10px] w-[120px]">{t('cantidad')}</th>
                    <th className="text-left px-4 py-2 font-semibold text-slate-600 uppercase tracking-wider text-[10px] w-[100px]">{t('unidad')}</th>
                    <th className="w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {form.detalles.map((d, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2">
                        <select value={d.material_solicitado} onChange={(e) => {
                          const mat = materiales.find(m => m.nombre === e.target.value)
                          const dets = [...form.detalles]
                          dets[i] = { material_solicitado: e.target.value, cantidad_solicitada: dets[i].cantidad_solicitada, unidad: mat?.unidad_medida || dets[i].unidad }
                          setForm({ ...form, detalles: dets })
                        }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required>
                          <option value="">-- Seleccionar --</option>
                          {(() => {
                            const grupos: Record<string, Material[]> = {}
                            for (const m of materiales) {
                              if (!grupos[m.categoria]) grupos[m.categoria] = []
                              grupos[m.categoria].push(m)
                            }
                            return Object.entries(grupos).sort(([a],[b]) => a.localeCompare(b)).map(([cat, mats]) => (
                              <optgroup key={cat} label={cat}>
                                {mats.map(m => <option key={m.id} value={m.nombre}>{m.nombre} ({m.unidad_medida})</option>)}
                              </optgroup>
                            ))
                          })()}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input type="number" step="0.01" min="0.01" value={d.cantidad_solicitada} onChange={(e) => updateDetalle(i, 'cantidad_solicitada', +e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" required />
                      </td>
                      <td className="px-4 py-2">
                        <input value={d.unidad} onChange={(e) => updateDetalle(i, 'unidad', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="kg, und, m..." />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {form.detalles.length > 1 && (
                          <button type="button" onClick={() => removeDetalle(i)} className="p-1.5 text-rose-400 hover:text-rose-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all">{t('guardar')}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs lg:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {[1,2,3,4,5,6,7,8].map(i => <th key={i} className="px-3 lg:px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-12" /></th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1,2,3,4].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6,7,8].map(j => (
                      <td key={j} className="px-3 lg:px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${20 + Math.random() * 40}%` }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="modern-card p-12 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-slate-500 font-medium">{t('sin_datos')}</p>
        </div>
      ) : (
        <div className="modern-card overflow-hidden border-none shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('no_requisicion') || 'No. Req'}</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('fecha')}</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('destino_uso') || 'Destino / Uso'}</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('proyecto')}</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('residente')}</th>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('material_solicitado') || 'Material Solicitado'}</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('cantidad')}</th>
                  <th className="text-right px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('recibido') || 'Recibido'}</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('estado')}</th>
                  <th className="text-center px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('acciones')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((req) => req.detalles.map((det) => (
                  <Fragment key={`${req.id}-${det.id}`}>
                    <tr className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-xs text-slate-600">{req.no_requisicion || `#${req.id}`}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-500 text-xs">{req.fecha_solicitud ? new Date(req.fecha_solicitud).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600 text-xs">{req.destino_uso || '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-600">{req.proyecto_nombre || '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-700">{req.residente || '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{det.material_solicitado}</span>
                        {det.material_nombre && <span className="ml-2 text-xs text-slate-400">→ {det.material_nombre}</span>}
                        {det.factura_no && <span className="ml-2 text-[10px] text-slate-400">(Fact: {det.factura_no})</span>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-slate-600">{det.cantidad_solicitada} {det.unidad}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-medium text-emerald-600">{det.cantidad_recibida > 0 ? `${det.cantidad_recibida}` : '-'}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border uppercase tracking-wider ${estadoStyles[req.estado] || ''}`}>{t(req.estado)}</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleExportPdfItem(req.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </button>
                          {req.estado !== 'completada' && (
                            <button onClick={() => {
                              if (det.cantidad_recibida > 0) {
                                setRecibirForm({ material_id: det.material_id || 0, cantidad_recibida: det.cantidad_recibida, factura_id: det.factura_id || 0 })
                              } else {
                                setRecibirForm({ material_id: 0, cantidad_recibida: 1, factura_id: 0 })
                              }
                              setRecibirId(recibirId === det.id ? null : det.id)
                            }} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                              {det.cantidad_recibida > 0 ? (t('editar') || 'Editar') : (t('recibir') || 'Recibir')}
                            </button>
                          )}
                          {req.estado === 'pendiente' && (
                            <>
                              <button onClick={() => { setRecibirId(null); handleEdit(req) }} className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title={t('editar')}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDelete(req)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title={t('eliminar')}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {recibirId === det.id && (
                      <tr key={`recibir-${det.id}`}>
                        <td colSpan={10} className="px-6 py-4 bg-emerald-50/50">
                          <form onSubmit={(e) => { e.preventDefault(); handleRecibir(det.id, 'add') }} className="flex flex-wrap items-end gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('material')}</label>
                              <select value={recibirForm.material_id} onChange={(e) => setRecibirForm({ ...recibirForm, material_id: +e.target.value })} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm" required>
                                <option value="0">{t('seleccionar')}</option>
                                {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('cantidad_recibir') || 'Cant. a Recibir'}</label>
                              <input type="number" step="0.01" min="0.01" value={recibirForm.cantidad_recibida} onChange={(e) => setRecibirForm({ ...recibirForm, cantidad_recibida: +e.target.value })} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm w-[100px]" required />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('factura')}</label>
                              <select value={recibirForm.factura_id} onChange={(e) => setRecibirForm({ ...recibirForm, factura_id: +e.target.value })} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm">
                                <option value="0">{t('sin_factura') || 'Sin factura'}</option>
                                {facturas.map((f) => <option key={f.id} value={f.id}>{f.no_factura} — {f.proveedor}</option>)}
                              </select>
                            </div>
                            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 transition-all">{t('recibir') || 'Recibir'}</button>
                            {det.cantidad_recibida > 0 && (
                              <button type="button" onClick={() => handleRecibir(det.id, 'save')} className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/25 hover:bg-amber-700 transition-all">{t('guardar_cambios') || 'Guardar Cambios'}</button>
                            )}
                            <button type="button" onClick={() => setRecibirId(null)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
