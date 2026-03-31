import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AuthPage from './pages/AuthPage'
import AnalyzeTab from './pages/AnalyzeTab'
import HistoryTab from './pages/HistoryTab'
import CompareTab from './pages/CompareTab'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('access_token'))
  const [tab, setTab] = useState('analyze')

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('username')
    setAuthed(false)
  }

  if (!authed) return (
    <>
      <AuthPage onLogin={() => setAuthed(true)} />
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
        © 2024 ResearchAI · Powered by Groq Llama-3.3 & Machine Learning
      </footer>
      <ToastContainer />
    </div>
  )
}
