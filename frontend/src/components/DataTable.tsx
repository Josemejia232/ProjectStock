import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface Column<T> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 lg:px-6 py-3 lg:py-4">
          <div className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${40 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

const DataTable = memo(function DataTable<T extends Record<string, any>>({ columns, data, loading, onEdit, onDelete }: Props<T>) {
  const { t } = useTranslation()

  if (loading) {
    const colCount = columns.length + (onEdit || onDelete ? 1 : 0)
    return (
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs lg:text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider w-16 lg:w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <SkeletonRow cols={colCount} />
              <SkeletonRow cols={colCount} />
              <SkeletonRow cols={colCount} />
              <SkeletonRow cols={colCount} />
              <SkeletonRow cols={colCount} />
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 lg:p-12 text-center border border-slate-200 rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          </div>
          <p className="text-sm text-slate-500">{t('sin_datos')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs lg:text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-3 lg:px-6 py-3 text-xs uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && <th className="text-center px-3 lg:px-6 py-3 text-xs uppercase tracking-wider w-16 lg:w-20">{t('acciones')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : <span>{String(row[col.key] ?? '-')}</span>}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-3 lg:px-6 py-2 lg:py-3 whitespace-nowrap text-center w-16 lg:w-20">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)} 
                          className="p-1 hover:text-indigo-600 transition-colors"
                          title={t('editar')}
                        >
                          <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)} 
                          className="p-1 hover:text-rose-600 transition-colors"
                          title={t('eliminar')}
                        >
                          <svg className="w-3.5 h-3.5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default DataTable
