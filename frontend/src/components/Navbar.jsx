import { motion } from 'framer-motion'

export default function Navbar({ activeTab, setActiveTab, username, onLogout }) {
  const links = [
    { id: 'analyze', label: 'Analyze' },
    { id: 'history', label: 'History' },
    { id: 'compare', label: 'Compare' },
  ]
  return (
    <nav className="bg-bg-2/97 backdrop-blur-xl border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <motion.div whileHover={{ scale: 1.05 }} onClick={() => setActiveTab('analyze')}
          className="flex items-center gap-2 text-xl font-bold text-purple cursor-pointer hover:text-pink transition-colors">
          🔬 <span>ResearchAI</span>
        </motion.div>
        <div className="flex items-center gap-6">
          {links.map(l => (
            <button key={l.id} onClick={() => setActiveTab(l.id)}
              className={`text-sm font-medium transition-colors cursor-pointer ${activeTab === l.id ? 'text-purple border-b-2 border-purple pb-0.5' : 'text-sub hover:text-purple'}`}>
              {l.label}
            </button>
          ))}
          <div className="flex items-center gap-3 pl-6 border-l border-border">
            <span className="text-purple font-semibold text-sm">{username}</span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onLogout}
              className="px-4 py-1.5 border-2 border-error text-error rounded-lg text-sm font-semibold hover:bg-error hover:text-white transition-all">
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  )
}
