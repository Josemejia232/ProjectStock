import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportesApi, movimientosApi, facturasApi, requisicionesApi } from '../api/client'
import type { Dashboard, Movimiento, Factura, ResumenInsumo } from '../types'
import type { Requisicion } from '../types'

const StatIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'total_proyectos': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    case 'proyectos_activos': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    case 'total_materiales': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    case 'total_movimientos': return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
    default: return null
  }
}

const alertaConfig: Record<string, { label: string; color: string }> = {
  excedente: { label: 'Excedente', color: 'amber' },
  faltante: { label: 'Faltante', color: 'rose' },
  stock_critico: { label: 'Stock Crítico', color: 'orange' },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Dashboard | null>(null)
  const [recentMovs, setRecentMovs] = useState<Movimiento[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [requisiciones, setRequisiciones] = useState<Requisicion[]>([])
  const [resumen, setResumen] = useState<ResumenInsumo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportesApi.dashboard(),
      movimientosApi.list(),
      facturasApi.list(),
      requisicionesApi.list(),
      reportesApi.resumenInsumos(),
    ]).then(([d, mv, fc, rq, rs]) => {
      setData(d)
      setRecentMovs(mv.slice(0, 8))
      setFacturas(fc.slice(0, 5))
      setRequisiciones(rq.filter(r => r.estado !== 'completada'))
      setResumen(rs)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl lg:text-3xl tracking-tight">{t('dashboard')}</h2>
        <p className="text-sm lg:text-base text-slate-500 mt-1">{t('dashboard_subtitle') || 'Resumen general de operaciones'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="border border-slate-200 rounded-lg p-6">
            <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2 mb-3" />
            <div className="h-8 bg-slate-100 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )

  const totalInvertido = facturas.reduce((s, f) => s + f.valor, 0)

  const cards = [
    { id: 'total_proyectos', label: t('total_proyectos'), value: data?.total_proyectos ?? 0, color: 'indigo' },
    { id: 'proyectos_activos', label: t('proyectos_activos'), value: data?.proyectos_activos ?? 0, color: 'emerald' },
    { id: 'total_materiales', label: t('total_materiales'), value: data?.total_materiales ?? 0, color: 'amber' },
    { id: 'total_movimientos', label: t('total_movimientos'), value: data?.total_movimientos ?? 0, color: 'rose' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('dashboard')}</h2>
        <p className="text-slate-500 mt-1">{'Resumen general de operaciones'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ id, label, value, color }) => (
          <div key={id} className="modern-card p-6 flex items-center gap-5 group hover:shadow-lg transition-all">
            <div className={`p-4 rounded-2xl bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
              <StatIcon type={id} />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { tipo: 'excedente', value: data?.excedentes ?? 0 },
          { tipo: 'faltante', value: data?.faltantes ?? 0 },
          { tipo: 'stock_critico', value: data?.stock_critico ?? 0 },
        ].map(({ tipo, value }) => {
          const c = alertaConfig[tipo]
          return (
            <div key={tipo} className={`modern-card p-5 flex items-center justify-between border-l-4 border-${c.color}-500`}>
              <span className="text-sm font-semibold text-slate-700">{c.label}</span>
              <span className={`text-2xl font-bold text-${c.color}-600`}>{value}</span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Bajo / Alertas */}
        <div className="modern-card p-6">
          <h3 className="font-bold text-slate-800 mb-4">{t('alertas_stock') || 'Alertas de Stock'}</h3>
          {(data?.alertas ?? []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Todo en orden — no hay alertas activas</p>
          ) : (
            <div className="space-y-3">
              {(data?.alertas ?? []).map(a => {
                const c = alertaConfig[a.tipo_alerta]
                return (
                  <div key={a.inventario_id} className={`flex items-center gap-3 p-3 rounded-xl bg-${c.color}-50/50 border border-${c.color}-100`}>
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-${c.color}-100 text-${c.color}-600`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.material_nombre}</p>
                      <p className="text-xs text-slate-500 truncate">{a.proyecto_nombre}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700">{a.cantidad_actual} <span className="text-xs text-slate-400">{a.material_unidad}</span></p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-${c.color}-100 text-${c.color}-700`}>{c.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Últimas Facturas */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{t('ultimas_facturas') || 'Últimas Facturas'}</h3>
            <span className="text-sm font-bold text-emerald-600">${totalInvertido.toLocaleString()}</span>
          </div>
          {facturas.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('sin_datos')}</p>
          ) : (
            <div className="space-y-3">
              {facturas.map(f => (
                <div key={f.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{f.no_factura}</p>
                    <p className="text-xs text-slate-400 truncate">{f.proveedor} · {f.insumo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">${f.valor.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">{f.fecha ? new Date(f.fecha).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resumen de Inventario */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 lg:px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('inventario')}</h3>
          <span className="text-xs text-slate-400">{resumen.length} insumos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs lg:text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-3 lg:px-6 py-2.5 text-xs uppercase tracking-wider">{t('insumo') || 'Insumo'}</th>
                <th className="text-center px-3 lg:px-6 py-2.5 text-xs uppercase tracking-wider">Un</th>
                <th className="text-right px-3 lg:px-6 py-2.5 text-xs uppercase tracking-wider">{t('entradas')}</th>
                <th className="text-right px-3 lg:px-6 py-2.5 text-xs uppercase tracking-wider">{t('salidas')}</th>
                <th className="text-right px-3 lg:px-6 py-2.5 text-xs uppercase tracking-wider">{t('stock')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {resumen.slice(0, 8).map(r => (
                <tr key={r.material_id} className="hover:bg-slate-50">
                  <td className="px-3 lg:px-6 py-2 whitespace-nowrap">{r.material_nombre}</td>
                  <td className="px-3 lg:px-6 py-2 whitespace-nowrap text-center"><span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] uppercase">{r.unidad_medida}</span></td>
                  <td className="px-3 lg:px-6 py-2 whitespace-nowrap text-right text-emerald-600">{r.entradas.toFixed(0)}</td>
                  <td className="px-3 lg:px-6 py-2 whitespace-nowrap text-right text-red-600">{r.salidas.toFixed(0)}</td>
                  <td className={`px-3 lg:px-6 py-2 whitespace-nowrap text-right ${r.stock < 0 ? 'text-red-600 font-bold' : ''}`}>{r.stock < 0 ? `(${Math.abs(r.stock).toFixed(0)})` : r.stock.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requisiciones Pendientes */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">{t('requisiciones_pendientes') || 'Requisiciones Pendientes'}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{requisiciones.length}</span>
          </div>
          {requisiciones.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Sin requisiciones pendientes</p>
          ) : (
            <div className="space-y-3">
              {requisiciones.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">#{r.id} — {r.residente}</p>
                    <p className="text-xs text-slate-400 truncate">{r.proyecto_nombre} · {r.detalles.length} material(es)</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${r.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{r.estado}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actividad Reciente */}
        <div className="modern-card p-6">
          <h3 className="font-bold text-slate-800 mb-4">{t('actividad_reciente') || 'Actividad Reciente'}</h3>
          {recentMovs.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('sin_datos')}</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {recentMovs.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center ${m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {m.tipo === 'entrada'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17H4m0 0l4 4m-4-4l4-4m12-6H4m0 0l4 4M4 7l4-4" />}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {m.tipo === 'entrada' ? 'Entrada' : 'Salida'} — {m.material_nombre}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{m.proyecto_nombre} · {m.cantidad} {m.material_unidad}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
