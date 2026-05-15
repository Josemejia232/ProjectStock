import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportesApi } from '../api/client'
import type { Alerta, AlertaPrecio } from '../types'

export default function AlertasPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState<Alerta[]>([])
  const [precios, setPrecios] = useState<AlertaPrecio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportesApi.alertas().then(setItems),
      reportesApi.alertasPrecios().then(setPrecios),
    ]).finally(() => setLoading(false))
  }, [])

  const alertaConfig: Record<string, { bg: string; badge: string; icon: string; text: string }> = {
    excedente: {
      bg: 'bg-amber-50/50 border-amber-100',
      badge: 'bg-amber-100 text-amber-700',
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      text: 'text-amber-800',
    },
    faltante: {
      bg: 'bg-rose-50/50 border-rose-100',
      badge: 'bg-rose-100 text-rose-700',
      icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
      text: 'text-rose-800',
    },
    stock_critico: {
      bg: 'bg-orange-50/50 border-orange-100',
      badge: 'bg-orange-100 text-orange-700',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      text: 'text-orange-800',
    },
  }

  if (loading) return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl lg:text-3xl tracking-tight">{t('alertas')}</h2>
      </div>
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
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl lg:text-3xl tracking-tight">{t('alertas')}</h2>
      </div>

      {/* Alertas de Stock */}
      <div>
        <h3 className="text-base lg:text-xl mb-4">{t('alertas_stock') || 'Alertas de Stock'}</h3>
        {items.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-8 lg:p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm">{t('sin_datos')}</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('tipo')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('material')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('proyecto')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('cantidad_actual')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('cantidad_minima')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('cantidad_maxima')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((a) => {
                    const c = alertaConfig[a.tipo_alerta]
                    return (
                      <tr key={a.inventario_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                          <span className={`text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider ${c.badge}`}>{t(a.tipo_alerta)}</span>
                        </td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{a.material_nombre}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{a.proyecto_nombre}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{a.cantidad_actual} {a.material_unidad}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-emerald-600">{a.cantidad_minima > 0 ? `${a.cantidad_minima} ${a.material_unidad}` : '-'}</td>
                        <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{a.cantidad_maxima > 0 ? `${a.cantidad_maxima} ${a.material_unidad}` : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de Cambio de Precio */}
      <div>
        <h3 className="text-base lg:text-xl mb-4">{t('alertas_precio') || 'Cambios de Precio'}</h3>
        {precios.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-8 lg:p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm">{t('sin_cambios_precio') || 'Sin cambios de precio registrados'}</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs lg:text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('material')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('proveedor')}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('precio_anterior') || 'Precio Anterior'}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('precio_nuevo') || 'Precio Nuevo'}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('diferencia') || 'Diferencia'}</th>
                    <th className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider">{t('fecha')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {precios.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{p.material_nombre}</td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{p.proveedor || '-'}</td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">${p.precio_anterior.toFixed(2)}</td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-emerald-600">${p.precio_nuevo.toFixed(2)}</td>
                      <td className={`px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap ${p.diferencia >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {p.diferencia >= 0 ? '+' : ''}{p.diferencia.toFixed(2)}
                      </td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">{new Date(p.fecha).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
