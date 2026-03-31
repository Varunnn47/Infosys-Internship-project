import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import API from './api'
import AuthPage from './pages/AuthPage'
import LandingPage from './pages/LandingPage'
import AnalyzeTab from './pages/AnalyzeTab'
import HistoryTab from './pages/HistoryTab'
import CompareTab from './pages/CompareTab'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('access_token'))
  const [tab, setTab] = useState('analyze')
  const [showAuth, setShowAuth] = useState(false)

  // Wake up backend on app load
  useEffect(() => { fetch(`${API}/`).catch(() => {}) }, [])

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    setAuthed(false)
    setShowAuth(false)
  }

  if (!authed && !showAuth) return (
    <>
      <LandingPage onGetStarted={() => setShowAuth(true)} />
      <ToastContainer />
    </>
  )

  if (!authed && showAuth) return (
    <>
      <AuthPage onLogin={() => { setAuthed(true); setShowAuth(false) }} />
      <ToastContainer />
    </>
  )

  return (
    <div className="min-h-screen bg-bg">
      <Navbar activeTab={tab} setActiveTab={setTab} username={localStorage.getItem('username')} onLogout={logout} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {tab === 'analyze' && <AnalyzeTab />}
          {tab === 'history' && <HistoryTab />}
          {tab === 'compare' && <CompareTab />}
        </motion.div>
      </AnimatePresence>
      <footer className="bg-bg-2 border-t border-border py-6 text-center text-muted text-sm mt-16">
        © 2024 ResearchAI
      </footer>
      <ToastContainer />
    </div>
  )
}
