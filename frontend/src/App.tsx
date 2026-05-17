import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
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
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/proyectos" element={<ProtectedRoute><ProyectosPage /></ProtectedRoute>} />
            <Route path="/materiales" element={<ProtectedRoute><MaterialesPage /></ProtectedRoute>} />
            <Route path="/inventario" element={<ProtectedRoute><InventarioPage /></ProtectedRoute>} />
            <Route path="/movimientos" element={<ProtectedRoute><MovimientosPage /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><AlertasPage /></ProtectedRoute>} />
            <Route path="/facturas" element={<ProtectedRoute><FacturasPage /></ProtectedRoute>} />
            <Route path="/requisiciones" element={<ProtectedRoute><RequisicionesPage /></ProtectedRoute>} />
            <Route path="/reporte-insumos" element={<ProtectedRoute><ReporteInsumosPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
