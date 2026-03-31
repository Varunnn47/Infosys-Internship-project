import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import API from '../api'
import { toast } from '../components/Toast'

export default function HistoryTab() {
  const token = localStorage.getItem('access_token')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/history`, { headers: { Authorization: `Bearer ${token}` } })
      setHistory(await res.json())
    } catch { toast('Failed to load history', 'error') }
    finally { setLoading(false) }
  }

  async function del(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this analysis?')) return
    await fetch(`${API}/history/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setHistory(h => h.filter(x => x.id !== id))
    toast('Deleted', 'info')
  }

  async function exportPdf(id, e) {
    e.stopPropagation()
    const res = await fetch(`${API}/export/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `analysis-${id}.pdf` })
    document.body.appendChild(a); a.click(); a.remove()
    toast('PDF Downloaded!', 'success')
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="w-12 h-12 border-4 border-bg-3 border-t-purple rounded-full animate-spin shadow-glow" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <h2 className="section-title">📚 Analysis History</h2>
      {history.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg">No analyses yet. Start by uploading a paper!</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {history.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                className="card p-6 cursor-pointer">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="font-bold text-white">📄 {item.title}</span>
                  <span className="text-muted text-xs whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sub text-sm leading-relaxed mb-4 line-clamp-2">{item.summary}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted bg-bg-3 px-2 py-1 rounded-md">📝 {item.word_count || 0} words</span>
                  <span className="text-xs text-muted bg-bg-3 px-2 py-1 rounded-md">💡 {(item.insights || []).length} insights</span>
                  {item.rating > 0 && <span className="text-xs text-muted bg-bg-3 px-2 py-1 rounded-md">⭐ {item.rating}/5</span>}
                  {item.note && <span className="text-xs text-muted bg-bg-3 px-2 py-1 rounded-md">📌 Has note</span>}
                  <div className="flex gap-2 ml-auto">
                    <motion.button whileHover={{ scale: 1.05 }} onClick={e => exportPdf(item.id, e)}
                      className="px-3 py-1.5 text-xs font-semibold border border-border text-sub rounded-lg hover:border-purple hover:text-purple transition-all">
                      PDF
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} onClick={e => del(item.id, e)}
                      className="px-3 py-1.5 text-xs font-semibold border border-border text-sub rounded-lg hover:border-error hover:text-error transition-all">
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
