import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { proyectosApi } from '../api/client'
import type { Proyecto, ProyectoForm } from '../types'
import DataTable from '../components/DataTable'

export default function ProyectosPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<ProyectoForm>({ nombre: '', descripcion: '', ubicacion: '', responsable: '', email: '', movil: '', estado: 'ejecucion' })
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    proyectosApi.list().then(setItems).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSubmit = async () => {
    if (editing) {
      await proyectosApi.update(editing, form)
    } else {
      await proyectosApi.create(form)
    }
    setForm({ nombre: '', descripcion: '', ubicacion: '', responsable: '', email: '', movil: '', estado: 'ejecucion' })
    setEditing(null)
    setShowForm(false)
    load()
  }

  const handleEdit = (item: Proyecto) => {
    setForm({ nombre: item.nombre, descripcion: item.descripcion, ubicacion: item.ubicacion, responsable: item.responsable || '', email: item.email || '', movil: item.movil || '', estado: item.estado })
    setEditing(item.id)
    setShowForm(true)
  }

  const handleDelete = async (item: Proyecto) => {
    if (!confirm(t('confirmar_eliminar'))) return
    await proyectosApi.remove(item.id)
    load()
  }

  const estadoStyles: Record<string, string> = {
    ejecucion: 'bg-blue-100 text-blue-700 border-blue-200',
    pausado: 'bg-amber-100 text-amber-700 border-amber-200',
    finalizado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (v: number) => <span className="font-mono text-xs">#{v}</span>,
    },
    {
      key: 'nombre',
      label: t('nombre'),
      render: (v: string) => <span>{v}</span>,
    },
    {
      key: 'responsable',
      label: t('responsable'),
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      key: 'email',
      label: t('email'),
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      key: 'movil',
      label: t('movil'),
      render: (v: string) => <span>{v || '-'}</span>,
    },
    {
      key: 'ubicacion',
      label: t('direccion'),
      render: (v: string) => (
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>{v || '-'}</span>
        </div>
      ),
    },
    {
      key: 'estado',
      label: t('estado'),
      render: (v: string) => (
        <span className={`text-[10px] px-2.5 py-1 rounded-lg border uppercase tracking-wider ${estadoStyles[v] || ''}`}>
          {t(v)}
        </span>
      ),
    },
  ]

  const estados = ['ejecucion', 'pausado', 'finalizado']

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-3xl font-bold tracking-tight">{t('proyectos')}</h2>
          <p className="text-sm lg:text-base text-slate-500 mt-1">{'Gestión y seguimiento de obras'}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ nombre: '', descripcion: '', ubicacion: '', responsable: '', email: '', movil: '', estado: 'ejecucion' }) }}
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{editing ? t('editar_proyecto') : t('nuevo_proyecto')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">ID</label>
                <input value={`#${editing}`} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400" disabled />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('nombre')}</label>
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('direccion')}</label>
              <input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('responsable')}</label>
              <input value={form.responsable || ''} onChange={(e) => setForm({ ...form, responsable: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('email')}</label>
              <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('movil')}</label>
              <input type="tel" value={form.movil || ''} onChange={(e) => setForm({ ...form, movil: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('estado')}</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none">
                {estados.map((est) => (
                  <option key={est} value={est}>{t(est)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">{t('cancelar')}</button>
            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 transition-all">{t('guardar')}</button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={items} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  )
}
