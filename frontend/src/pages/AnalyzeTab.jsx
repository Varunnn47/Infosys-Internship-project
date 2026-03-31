import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import API from '../api'
import { toast } from '../components/Toast'

const STEPS = ['📄 Extracting', '✂️ Chunking', '🧠 Embedding', '✨ Summarizing', '💡 Insights']
const STEP_PCT = [10, 30, 55, 75, 95]

export default function AnalyzeTab() {
  const token = localStorage.getItem('access_token')
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(-1)
  const [results, setResults] = useState(null)
  const [analysisId, setAnalysisId] = useState(null)
  const [context, setContext] = useState('')
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [qaMessages, setQaMessages] = useState([])
  const [qaInput, setQaInput] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [readingTime, setReadingTime] = useState(0)
  const [openCount, setOpenCount] = useState(1)
  const [showEmail, setShowEmail] = useState(false)
  const [emailAddr, setEmailAddr] = useState('')
  const [showTimeline, setShowTimeline] = useState(false)
  const [timeline, setTimeline] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef()
  const readingRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (results) {
      startTimeRef.current = Date.now()
      readingRef.current = setInterval(() => {
        setReadingTime(t => t + 1000)
      }, 1000)
    }
    return () => clearInterval(readingRef.current)
  }, [results])

  function formatTime(ms) {
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000)
    return `${m}m ${s}s`
  }

  async function analyze() {
    if (!file && !text.trim()) return toast('Please upload a PDF or paste text', 'error')
    setLoading(true); setStep(0); setResults(null)
    try {
      for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise(r => setTimeout(r, 300)) }
      let data
      if (file) {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch(`${API}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
        if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
        data = await res.json()
      } else {
        const res = await fetch(`${API}/summarize`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ text }) })
        if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
        data = await res.json()
      }
      setResults(data); setAnalysisId(data.analysis_id); setContext(text || '')
      setReadingTime(0); setOpenCount(1); setRating(0); setNote(''); setQaMessages([])
      toast('Analysis complete!', 'success')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false); setStep(-1) }
  }

  function clear() { setFile(null); setText(''); setResults(null); setStep(-1); setChatOpen(false) }

  async function saveRating(val) {
    setRating(val)
    await fetch(`${API}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ analysis_id: analysisId, rating: val }) })
    toast(`Rated ${val} stars!`, 'success')
  }

  async function saveNote() {
    await fetch(`${API}/note`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ analysis_id: analysisId, note }) })
    toast('Note saved!', 'success')
  }

  async function sendQA() {
    if (!qaInput.trim() || !results) return
    const q = qaInput; setQaInput(''); setQaMessages(m => [...m, { type: 'question', text: q }]); setQaLoading(true)
    try {
      const res = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question: q, context: results.summary + ' ' + (results.insights || []).join(' ') }) })
      const data = await res.json()
      setQaMessages(m => [...m, { type: 'answer', text: data.answer }])
    } catch { setQaMessages(m => [...m, { type: 'answer', text: 'Could not get answer.' }]) }
    finally { setQaLoading(false) }
  }

  async function sendChat() {
    if (!chatInput.trim() || !results) return
    const q = chatInput; setChatInput(''); setChatMessages(m => [...m, { type: 'user', text: q }])
    try {
      const res = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ question: q, context: results.summary + ' ' + (results.insights || []).join(' ') }) })
      const data = await res.json()
      setChatMessages(m => [...m, { type: 'ai', text: data.answer }])
    } catch { setChatMessages(m => [...m, { type: 'ai', text: 'Error getting response.' }]) }
  }

  async function downloadPdf() {
    const res = await fetch(`${API}/export/${analysisId}`, { headers: { Authorization: `Bearer ${token}` } })
    const blob = await res.blob()
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `analysis-${analysisId}.pdf` })
    document.body.appendChild(a); a.click(); a.remove()
    toast('PDF Downloaded!', 'success')
  }

  function downloadTxt() {
    const content = `AI RESEARCH PAPER ANALYSIS\n${'='.repeat(40)}\n\nSUMMARY:\n${results.summary}\n\nKEY INSIGHTS:\n${(results.insights || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nGenerated by ResearchAI`
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: 'text/plain' })), download: `analysis-${Date.now()}.txt` })
    document.body.appendChild(a); a.click(); a.remove()
    toast('Downloaded!', 'success')
  }

  async function sendEmail() {
    if (!emailAddr) return toast('Enter an email address', 'error')
    const res = await fetch(`${API}/email-summary`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ analysis_id: analysisId, email: emailAddr }) })
    if (res.ok) { toast(`Summary sent to ${emailAddr}`, 'success'); setShowEmail(false) }
    else toast('Failed to send email', 'error')
  }

  async function loadTimeline() {
    setShowTimeline(true)
    const res = await fetch(`${API}/history`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setTimeline(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10))
  }

  function onDrop(e) {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf' || f?.name?.endsWith('.docx')) setFile(f)
    else toast('Please drop a PDF or DOCX file', 'error')
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-14">
        <h1 className="text-5xl font-bold grad-text mb-4">AI Research Paper Summarizer</h1>
        <p className="text-sub text-lg mb-6">Extract key insights from any research paper in seconds</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {['⚡ Fast', '🎯 Accurate', '🔒 Secure'].map(b => (
            <motion.span key={b} whileHover={{ scale: 1.05, borderColor: '#8b5cf6', color: '#8b5cf6' }}
              className="bg-card border border-border px-4 py-1.5 rounded-full text-sm font-semibold text-sub cursor-default transition-all">
              {b}
            </motion.span>
          ))}
        </div>
      </motion.section>

      {/* Upload */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="section-title">Upload Your Paper</h2>
        <div className="bg-card border border-border rounded-2xl p-10 shadow-2xl">
          {/* Drop Zone */}
          <motion.div onDragOver={e => { e.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}
            onClick={() => fileRef.current.click()} whileHover={{ scale: 1.01 }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragging ? 'border-pink bg-purple/10' : 'border-purple bg-purple/5 hover:bg-purple/10 hover:border-pink'}`}>
            <div className="text-5xl mb-3 animate-bob">{file ? '✅' : '📄'}</div>
            <p className="font-semibold text-lg mb-1">{file ? file.name : 'Drag & Drop PDF here'}</p>
            <p className="text-muted text-sm my-2">or</p>
            <span className="grad-btn px-6 py-2 rounded-xl text-sm inline-block">Choose File</span>
            <p className="text-muted text-xs mt-3">PDF or DOCX · Max 10MB</p>
            <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
          </motion.div>

          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 h-px bg-border" /><span className="text-muted text-sm font-semibold">OR</span><div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Paste Research Paper Text</label>
            <textarea className="input-field resize-y" rows={10} placeholder="Paste your research paper text here..." value={text} onChange={e => setText(e.target.value)} />
            <span className="text-right text-muted text-xs">{text.length.toLocaleString()} characters</span>
          </div>

          {/* Progress */}
          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6">
                <div className="flex justify-between mb-3 flex-wrap gap-2">
                  {STEPS.map((s, i) => (
                    <span key={s} className={`text-xs font-medium px-3 py-1 rounded-full border transition-all ${i < step ? 'text-success border-success bg-success/10' : i === step ? 'text-purple border-purple bg-purple/10' : 'text-muted border-border'}`}>{s}</span>
                  ))}
                </div>
                <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#8b5cf6,#ec4899)' }} animate={{ width: `${step >= 0 ? STEP_PCT[step] : 0}%` }} transition={{ duration: 0.5 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={analyze} disabled={loading}
              className="grad-btn flex-1 py-4 text-base">
              {loading ? '⏳ Analyzing...' : '✨ Generate Summary'}
            </motion.button>
            {(file || text) && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.02 }} onClick={clear}
                className="px-6 py-4 border-2 border-error text-error rounded-xl font-semibold hover:bg-error hover:text-white transition-all">
                ✕ Clear
              </motion.button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-10">
            {results.is_abstract_only && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-warning/10 border border-warning rounded-xl px-6 py-3 text-warning font-medium mb-6">
                ⚠️ This looks like only an abstract. Upload the full paper for better results.
              </motion.div>
            )}

            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <h2 className="text-3xl font-bold">Analysis Results</h2>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: '📋 Copy', fn: () => { navigator.clipboard.writeText(`SUMMARY:\n${results.summary}\n\nKEY INSIGHTS:\n${(results.insights || []).map((s, i) => `${i + 1}. ${s}`).join('\n')}`); toast('Copied!', 'success') } },
                  { label: '⬇ TXT', fn: downloadTxt },
                  { label: '📄 PDF', fn: downloadPdf },
                  { label: '📧 Email', fn: () => setShowEmail(true) },
                  { label: '📈 Timeline', fn: loadTimeline },
                  { label: '🔄 New', fn: clear, primary: true },
                ].map(b => (
                  <motion.button key={b.label} whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }} onClick={b.fn}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${b.primary ? 'grad-btn border-purple' : 'bg-card border-border text-white hover:border-purple hover:text-purple'}`}>
                    {b.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Summary */}
              <ResultCard title="📝 Summary">
                <p className="text-sub leading-relaxed whitespace-pre-line text-sm">{results.summary}</p>
              </ResultCard>

              {/* Insights */}
              <ResultCard title="💡 Key Insights" tag="Top Findings">
                <ul className="space-y-2">
                  {(results.insights || []).map((ins, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="text-sub text-sm py-2 pl-6 border-b border-border/50 last:border-0 relative hover:text-white hover:pl-8 transition-all">
                      <span className="absolute left-0 text-success font-bold">✓</span>{ins}
                    </motion.li>
                  ))}
                </ul>
              </ResultCard>

              {/* Stats + Rating */}
              <div className="flex gap-6">
                <ResultCard title="📊 Stats" className="flex-1">
                  <div className="space-y-2">
                    {[['Words', (results.word_count || 0).toLocaleString()], ['Processing Time', `${results.processing_time || 0}s`], ['Insights Found', (results.insights || []).length], ['Reading Time', formatTime(readingTime)], ['Times Opened', openCount]].map(([k, v]) => (
                      <motion.div key={k} whileHover={{ borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.1)' }}
                        className="flex justify-between px-3 py-2 bg-purple/5 border border-border rounded-lg text-sm transition-all">
                        <span className="text-sub font-medium">{k}</span>
                        <span className="text-purple font-bold">{v}</span>
                      </motion.div>
                    ))}
                  </div>
                </ResultCard>

                <ResultCard title="⭐ Rate This Paper" className="flex-1">
                  <div className="flex gap-2 justify-center mt-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <motion.span key={v} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }} onClick={() => saveRating(v)}
                        className={`text-3xl cursor-pointer transition-colors ${v <= rating ? 'text-warning' : 'text-bg-3'}`}>★</motion.span>
                    ))}
                  </div>
                </ResultCard>
              </div>

              {/* Notes */}
              <ResultCard title="📝 Personal Notes">
                <textarea className="input-field resize-y min-h-[80px]" placeholder="Add your notes about this paper..." value={note} onChange={e => setNote(e.target.value)} />
                <motion.button whileHover={{ scale: 1.02 }} onClick={saveNote} className="grad-btn w-full py-3 mt-3 text-sm">Save Note</motion.button>
              </ResultCard>

              {/* Q&A */}
              <ResultCard title="❓ Ask Questions" tag="AI Assistant">
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto flex flex-col gap-3 mb-4 p-3 bg-purple/5 border border-border rounded-xl">
                  {qaMessages.length === 0 && <p className="text-muted text-sm italic text-center py-8">Ask questions about this paper to get instant AI-powered answers!</p>}
                  {qaMessages.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`px-4 py-3 rounded-xl text-sm max-w-[85%] leading-relaxed ${m.type === 'question' ? 'self-end text-white rounded-br-sm' : 'self-start text-white bg-bg-3 border-l-4 border-purple rounded-bl-sm'}`}
                      style={m.type === 'question' ? { background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' } : {}}>
                      {m.text}
                    </motion.div>
                  ))}
                  {qaLoading && (
                    <div className="flex items-center gap-2 text-muted text-sm italic">
                      <span>AI is thinking</span>
                      {[0, 0.2, 0.4].map((d, i) => <span key={i} className="w-1.5 h-1.5 bg-purple rounded-full animate-typing" style={{ animationDelay: `${d}s` }} />)}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <input className="input-field flex-1" placeholder="Ask a question about this paper..." value={qaInput} onChange={e => setQaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendQA()} />
                  <motion.button whileHover={{ scale: 1.05 }} onClick={sendQA} className="grad-btn px-6 py-2 text-sm">Ask</motion.button>
                </div>
              </ResultCard>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Floating Chat */}
      <AnimatePresence>
        {results && !chatOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileHover={{ scale: 1.1 }} onClick={() => setChatOpen(true)}
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full text-2xl text-white shadow-glow z-50 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>
            💬
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-8 right-8 w-80 h-[500px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 font-semibold text-white" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>
              <span>🤖 Research Assistant</span>
              <button onClick={() => setChatOpen(false)} className="text-white text-xl leading-none">×</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${m.type === 'user' ? 'self-end text-white' : 'self-start bg-bg-3 text-white'}`}
                  style={m.type === 'user' ? { background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' } : {}}>
                  {m.type === 'ai' ? `🤖 ${m.text}` : m.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input className="input-field flex-1 py-2 text-sm" placeholder="Ask about this paper..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} className="grad-btn px-3 py-2 text-sm rounded-lg">➤</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmail && (
          <Modal onClose={() => setShowEmail(false)} title="📧 Email Summary">
            <input className="input-field mb-4" type="email" placeholder="Enter email address" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} />
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.02 }} onClick={sendEmail} className="grad-btn flex-1 py-3">Send</motion.button>
              <button onClick={() => setShowEmail(false)} className="px-4 py-3 border-2 border-error text-error rounded-xl font-semibold hover:bg-error hover:text-white transition-all">Cancel</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Timeline Modal */}
      <AnimatePresence>
        {showTimeline && (
          <Modal onClose={() => setShowTimeline(false)} title="📈 Research Timeline" wide>
            <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
              {timeline.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex gap-4 relative">
                  {i < timeline.length - 1 && <div className="absolute left-[14px] top-10 bottom-[-16px] w-0.5 bg-border" />}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10"
                    style={{ background: item.id === analysisId ? 'linear-gradient(135deg,#ef4444,#f59e0b)' : 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-bg-3 p-4 rounded-xl border border-border hover:border-purple transition-all">
                    <p className="text-muted text-xs mb-1">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="font-semibold text-sm mb-2">{item.title}</p>
                    <p className="text-sub text-xs leading-relaxed">{item.summary?.substring(0, 100)}...</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function ResultCard({ title, tag, children, className = '' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`card p-7 ${className}`}>
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
        <h3 className="font-semibold text-lg">{title}</h3>
        {tag && <span className="text-xs font-semibold text-white px-3 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>{tag}</span>}
      </div>
      {children}
    </motion.div>
  )
}

function Modal({ onClose, title, children, wide }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-card border border-border rounded-2xl p-8 ${wide ? 'w-[90vw] max-w-3xl' : 'w-full max-w-md'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
