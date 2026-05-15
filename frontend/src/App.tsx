import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ProyectosPage from './pages/ProyectosPage'
import MaterialesPage from './pages/MaterialesPage'
import InventarioPage from './pages/InventarioPage'
import MovimientosPage from './pages/MovimientosPage'
import AlertasPage from './pages/AlertasPage'
import FacturasPage from './pages/FacturasPage'
import RequisicionesPage from './pages/RequisicionesPage'
import ReporteInsumosPage from './pages/ReporteInsumosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/proyectos" element={<ProyectosPage />} />
          <Route path="/materiales" element={<MaterialesPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/movimientos" element={<MovimientosPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/requisiciones" element={<RequisicionesPage />} />
          <Route path="/reporte-insumos" element={<ReporteInsumosPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
