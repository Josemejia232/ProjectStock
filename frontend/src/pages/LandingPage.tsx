import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { reportesApi, movimientosApi, facturasApi } from '../api/client'
import type { Dashboard, Movimiento, Factura } from '../types'

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (value === 0) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <>{count}</>
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

const StatIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'projects': return <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    case 'active': return <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    case 'materials': return <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    case 'movements': return <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
    default: return null
  }
}

const FeatureIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'projects': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
    case 'inventory': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
    case 'movements': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
    case 'requisitions': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
    case 'invoices': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    case 'reports': return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
    default: return null
  }
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<Dashboard | null>(null)
  const [recentMovs, setRecentMovs] = useState<Movimiento[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const heroReveal = useScrollReveal()
  const statsReveal = useScrollReveal()
  const featuresReveal = useScrollReveal()
  const benefitsReveal = useScrollReveal()
  const previewReveal = useScrollReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    Promise.all([
      reportesApi.dashboard(),
      movimientosApi.list(),
      facturasApi.list(),
    ]).then(([d, mv, fc]) => {
      setData(d)
      setRecentMovs(mv.slice(0, 5))
      setFacturas(fc.slice(0, 5))
    }).catch(() => {})
  }, [])

  const toggleLang = useCallback(() => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')
  }, [i18n])

  const stats = [
    { id: 'projects', label: t('total_proyectos'), value: data?.total_proyectos ?? 0, color: 'indigo' },
    { id: 'active', label: t('proyectos_activos'), value: data?.proyectos_activos ?? 0, color: 'emerald' },
    { id: 'materials', label: t('total_materiales'), value: data?.total_materiales ?? 0, color: 'amber' },
    { id: 'movements', label: t('total_movimientos'), value: data?.total_movimientos ?? 0, color: 'rose' },
  ]

  const features = [
    { id: 'projects', tKey: ['landing_feature_1_title', 'landing_feature_1_desc'] },
    { id: 'inventory', tKey: ['landing_feature_2_title', 'landing_feature_2_desc'] },
    { id: 'movements', tKey: ['landing_feature_3_title', 'landing_feature_3_desc'] },
    { id: 'requisitions', tKey: ['landing_feature_4_title', 'landing_feature_4_desc'] },
    { id: 'invoices', tKey: ['landing_feature_5_title', 'landing_feature_5_desc'] },
    { id: 'reports', tKey: ['landing_feature_6_title', 'landing_feature_6_desc'] },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden selection:bg-indigo-200 selection:text-indigo-900">
      <style>{`
        @keyframes float { 0%,100% { transform:translateY(0) rotate(0deg) } 33% { transform:translateY(-8px) rotate(1deg) } 66% { transform:translateY(4px) rotate(-1deg) } }
        @keyframes gradientShift { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
        @keyframes pulse-ring { 0% { transform:scale(0.95); opacity:0.7 } 100% { transform:scale(1.4); opacity:0 } }
        .hero-dot { animation: float 6s ease-in-out infinite }
        .hero-dot:nth-child(2) { animation-delay:-2s }
        .hero-dot:nth-child(3) { animation-delay:-4s }
        .hero-dot:nth-child(4) { animation-delay:-5.5s }
        .hero-dot:nth-child(5) { animation-delay:-3.2s }
        .hero-dot:nth-child(6) { animation-delay:-1s }
      `}</style>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-dark shadow-2xl shadow-black/10 py-3' : 'py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${scrolled ? 'text-white' : 'text-white'}`}>
              Project<span className="text-cyan-400">Stock</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <a href="#features" className={`text-sm font-medium transition-colors duration-500 ${scrolled ? 'text-slate-300 hover:text-white' : 'text-indigo-100 hover:text-white'}`}>{t('landing_features_title')}</a>
            <a href="#benefits" className={`text-sm font-medium transition-colors duration-500 ${scrolled ? 'text-slate-300 hover:text-white' : 'text-indigo-100 hover:text-white'}`}>{t('landing_benefits_title')}</a>
            <button onClick={toggleLang} className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all duration-300 ${
              scrolled ? 'border-white/20 text-slate-300 hover:bg-white/10 hover:text-white' : 'border-white/30 text-indigo-100 hover:bg-white/10 hover:text-white'
            }`}>
              {i18n.language === 'es' ? 'EN' : 'ES'}
            </button>
            <Link to="/login" className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-black/10 hover:shadow-black/20 transition-all duration-300 hover:-translate-y-0.5">
              {t('landing_nav_enter')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
          </div>

          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            {mobileMenu ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            )}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden glass-dark border-t border-white/10 mt-3 py-4 px-6 space-y-3">
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-300 hover:text-white py-1.5">{t('landing_features_title')}</a>
            <a href="#benefits" onClick={() => setMobileMenu(false)} className="block text-sm text-slate-300 hover:text-white py-1.5">{t('landing_benefits_title')}</a>
            <button onClick={toggleLang} className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              {i18n.language === 'es' ? 'EN' : 'ES'}
            </button>
            <Link to="/login" onClick={() => setMobileMenu(false)} className="block w-full text-center px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition-colors">
              {t('landing_nav_enter')}
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" style={{ backgroundSize: '400% 400%', animation: 'gradientShift 15s ease infinite' }}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 50%)'
          }}/>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1.5\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}/>
        </div>

        {/* Floating geometric orbs */}
        <div className="hero-dot absolute top-1/4 left-[10%] w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl"/>
        <div className="hero-dot absolute top-[15%] right-[5%] w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl"/>
        <div className="hero-dot absolute bottom-[10%] left-[20%] w-64 h-64 rounded-full bg-purple-500/15 blur-3xl"/>
        <div className="hero-dot absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl"/>
        <div className="hero-dot absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 to-cyan-400/5 blur-3xl"/>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-32" ref={heroReveal.ref}>
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-8 transition-all duration-1000 ${
            heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-xs font-semibold text-indigo-100 tracking-wide">v2.0 — Control de inventario inteligente</span>
          </div>

          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-white mb-6 transition-all duration-1000 delay-100 ${
            heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {t('landing_hero_title')}
          </h1>

          <p className={`text-base md:text-xl text-indigo-100/80 max-w-2xl mx-auto leading-relaxed mb-10 transition-all duration-1000 delay-200 ${
            heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            {t('landing_hero_subtitle')}
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-300 ${
            heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}>
            <Link to="/login" className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-indigo-700 text-base font-bold shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"/>
              <span className="relative">{t('landing_hero_cta')}</span>
              <svg className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </Link>
            <a href="#stats" className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/10 hover:border-white/40 hover:text-white transition-all duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              {t('landing_stats_title')}
            </a>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-white to-transparent z-10"/>
      </section>

      {/* STATS */}
      <section id="stats" className="relative -mt-24 z-20 pb-16" ref={statsReveal.ref}>
        <div className="max-w-5xl mx-auto px-6">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 transition-all duration-1000 ${
            statsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            {stats.map(({ id, label, value, color }) => (
              <div key={id} className="group bg-white rounded-2xl p-5 md:p-7 border border-slate-200/60 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-300/50 hover:-translate-y-1 transition-all duration-500">
                <div className={`inline-flex p-3 rounded-xl bg-${color}-50 text-${color}-600 mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <StatIcon type={id} />
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                  <AnimatedCounter value={value} />
                </p>
                <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 md:py-32 bg-slate-50/50" ref={featuresReveal.ref}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">Módulos</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">{t('landing_features_title')}</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Cada herramienta diseñada para resolver un problema real en la gestión de materiales de construcción.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ id, tKey }, i) => (
              <div key={id} className={`group bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-500 hover:-translate-y-1.5 ${
                featuresReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-cyan-50 text-indigo-600 mb-5 group-hover:from-indigo-100 group-hover:to-cyan-100 group-hover:scale-110 transition-all duration-300">
                  <FeatureIcon type={id} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{t(tKey[0])}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(tKey[1])}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="py-24 md:py-32 bg-white" ref={benefitsReveal.ref}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-1000 ${benefitsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4">Por qué ProjectStock</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight mb-4">{t('landing_benefits_title')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
            {[1, 2, 3, 4].map((n, i) => (
              <div key={n} className={`flex gap-5 transition-all duration-700 ${benefitsReveal.visible ? 'opacity-100 translate-x-0' : `opacity-0 ${i % 2 === 0 ? '-translate-x-8' : 'translate-x-8'}`}`} style={{ transitionDelay: `${i * 120}ms` }}>
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {/* {n === 1 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>} */}
                  {n === 1 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg>}
                  {n === 2 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>}
                  {n === 3 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>}
                  {n === 4 && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{t(`landing_benefit_${n}_title`)}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{t(`landing_benefit_${n}_desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="py-24 md:py-32 bg-slate-900 relative overflow-hidden" ref={previewReveal.ref}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.3) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(6,182,212,0.3) 0%, transparent 60%)'
        }}/>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}/>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className={`text-center mb-14 transition-all duration-1000 ${previewReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">{t('landing_preview_title')}</h2>
            <p className="text-indigo-200/70">{t('landing_preview_desc')}</p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-1000 delay-200 ${
            previewReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Recent Movements */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {t('actividad_reciente')}
              </h3>
              <div className="space-y-3">
                {recentMovs.map(m => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                      m.tipo === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {m.tipo === 'entrada'
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17H4m0 0l4 4m-4-4l4-4m12-6H4m0 0l4 4M4 7l4-4"/>}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{m.material_nombre}</p>
                      <p className="text-xs text-slate-400 truncate">{m.proyecto_nombre} · {m.cantidad} {m.material_unidad}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {m.fecha ? new Date(m.fecha).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
                {recentMovs.length === 0 && <p className="text-slate-500 text-xs text-center py-6">{t('sin_datos')}</p>}
              </div>
            </div>

            {/* Latest Invoices */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                {t('ultimas_facturas')}
              </h3>
              {facturas.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">{t('sin_datos')}</p>
              ) : (
                <div className="space-y-3">
                  {facturas.map(f => (
                    <div key={f.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{f.no_factura}</p>
                        <p className="text-xs text-slate-400 truncate">{f.proveedor} · {f.insumo}</p>
                      </div>
                      <p className="text-sm font-bold text-emerald-400 shrink-0">${f.valor.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="bg-slate-950 text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <span className="text-lg font-bold">Project<span className="text-cyan-400">Stock</span></span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">{t('landing_footer_cta')}</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">{t('landing_footer_text')}</p>
          <Link to="/login" className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white text-base font-bold shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300">
            {t('landing_hero_cta')}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </Link>
          <p className="text-xs text-slate-600 mt-12">&copy; {new Date().getFullYear()} ProjectStock</p>
        </div>
      </footer>
    </div>
  )
}
