import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reportesApi } from '../api/client'
import type { InsumoPorProyecto } from '../types'

export default function ReporteInsumosPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<InsumoPorProyecto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportesApi.insumosPorProyecto()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('insumos_por_proyecto') || 'Insumos por Proyecto'}</h2>
        <p className="text-slate-500 mt-1">{t('insumos_por_proyecto_subtitle') || 'Stock de materiales por proyecto'}</p>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {[1,2,3].map(i => <th key={i} className="px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse w-16" /></th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1,2,3,4].map(i => (
                <tr key={i}>
                  {[1,2,3].map(j => (
                    <td key={j} className="px-6 py-3"><div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${20 + Math.random() * 40}%` }} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">{t('insumos_por_proyecto') || 'Insumos por Proyecto'}</h2>
        <p className="text-slate-500 mt-1">{t('insumos_por_proyecto_subtitle') || 'Stock de materiales por proyecto'}</p>
      </div>

      <div className="modern-card overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">{t('insumo') || 'Insumo'}</th>
                <th className="text-center px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] w-[60px]">Un</th>
                {data.proyectos.map(p => (
                  <th key={p} className="text-right px-4 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] min-w-[100px]">{p}</th>
                ))}
                <th className="text-right px-6 py-4 font-semibold text-slate-600 uppercase tracking-wider text-[11px] min-w-[80px]">{t('total') || 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.insumos.map(item => (
                <tr key={item.material_id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-3 whitespace-nowrap font-medium text-slate-800">{item.material_nombre}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] uppercase text-slate-600">{item.unidad_medida}</span>
                  </td>
                  {data.proyectos.map(p => (
                    <td key={p} className="px-4 py-3 whitespace-nowrap text-right font-mono text-sm text-slate-600">
                      {item.cantidades[p] > 0 ? item.cantidades[p] : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-3 whitespace-nowrap text-right font-bold text-slate-800">{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
