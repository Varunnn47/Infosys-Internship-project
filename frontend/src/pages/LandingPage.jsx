import { motion } from 'framer-motion'

const features = [
  { icon: '🤖', title: 'AI-Powered Summaries', desc: 'Groq Llama-3.3-70b generates concise, accurate summaries in seconds.' },
  { icon: '💡', title: 'Key Insights', desc: 'Automatically extracts the most important findings and contributions.' },
  { icon: '⚖️', title: 'Paper Comparison', desc: 'Side-by-side analysis of two research papers to find similarities and differences.' },
  { icon: '❓', title: 'Chat with Papers', desc: 'Ask questions about your uploaded paper and get instant AI answers.' },
  { icon: '📚', title: 'Research History', desc: 'Track, rate, and organize all your analyzed papers in one place.' },
  { icon: '📄', title: 'Export & Share', desc: 'Download results as PDF or TXT, or email summaries to colleagues.' },
]

const steps = [
  { n: '01', title: 'Upload Your Paper', desc: 'Drag & drop a PDF/DOCX or paste text directly.' },
  { n: '02', title: 'AI Analyzes It', desc: 'Groq AI processes and extracts key information instantly.' },
  { n: '03', title: 'Get Insights', desc: 'Receive a summary, key insights, citations, and more.' },
]

const stats = [
  { value: '2-5s', label: 'Processing Time' },
  { value: '10MB', label: 'Max File Size' },
  { value: '70B', label: 'Model Parameters' },
  { value: '100%', label: 'Secure & Private' },
]

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="bg-bg-2/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 text-xl font-bold text-purple cursor-pointer">
            🔬 <span>ResearchAI</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted}
              className="px-4 py-2 border-2 border-purple text-purple rounded-xl text-sm font-semibold hover:bg-purple hover:text-white transition-all">
              Login
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted}
              className="grad-btn px-5 py-2 text-sm rounded-xl">
              Get Started Free
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 px-8 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
          <h1 className="text-6xl font-bold grad-text mb-6 leading-tight">
            Understand Research Papers<br />in Seconds
          </h1>
          <p className="text-sub text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any research paper and get AI-powered summaries, key insights, citations, and answers to your questions — instantly.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted}
              className="grad-btn px-8 py-4 text-lg rounded-xl shadow-glow-lg">
              🚀 Start Analyzing Free
            </motion.button>
            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted}
              className="px-8 py-4 text-lg rounded-xl border-2 border-border text-sub hover:border-purple hover:text-purple transition-all">
              👀 See Demo
            </motion.button>
          </div>
        </motion.div>

        {/* Hero preview card */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
          className="relative z-10 mt-16 max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-2xl text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-error" />
            <div className="w-3 h-3 rounded-full bg-warning" />
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted text-xs ml-2">ResearchAI — Analysis Results</span>
          </div>
          <div className="space-y-3">
            <div className="bg-bg-3 rounded-xl p-4">
              <p className="text-purple text-xs font-semibold mb-2">📝 SUMMARY</p>
              <p className="text-sub text-sm leading-relaxed">This paper proposes a novel transformer-based architecture for natural language processing tasks, achieving state-of-the-art results on multiple benchmarks with 40% fewer parameters than existing models...</p>
            </div>
            <div className="bg-bg-3 rounded-xl p-4">
              <p className="text-purple text-xs font-semibold mb-2">💡 KEY INSIGHTS</p>
              <div className="space-y-1">
                {['Novel attention mechanism reduces computational complexity by O(n log n)', 'Achieves 94.2% accuracy on GLUE benchmark', 'Model trained on 1.2TB of curated text data'].map((ins, i) => (
                  <p key={i} className="text-sub text-xs flex gap-2"><span className="text-success">✓</span>{ins}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-8 border-y border-border bg-bg-2/50">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-4xl font-bold grad-text mb-2">{s.value}</p>
              <p className="text-muted text-sm font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-sub text-lg">Powerful features to supercharge your research workflow</p>
          </motion.div>
          <div className="grid grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, borderColor: '#8b5cf6' }}
                className="bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-glow cursor-default relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#8b5cf6,#ec4899,#06b6d4)' }} />
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sub text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-8 bg-bg-2/50">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-sub text-lg">Three simple steps to unlock research insights</p>
          </motion.div>
          <div className="flex flex-col gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex items-center gap-6 bg-card border border-border rounded-2xl p-6 hover:border-purple hover:shadow-glow transition-all">
                <div className="text-5xl font-bold grad-text flex-shrink-0 w-16">{s.n}</div>
                <div>
                  <h3 className="font-bold text-xl mb-1">{s.title}</h3>
                  <p className="text-sub">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple/10 via-pink/5 to-cyan/10 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
          <h2 className="text-5xl font-bold mb-6">Ready to Transform<br />Your Research?</h2>
          <p className="text-sub text-xl mb-10 max-w-xl mx-auto">Join researchers who use ResearchAI to save hours of reading time every week.</p>
          <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }} onClick={onGetStarted}
            className="grad-btn px-10 py-5 text-xl rounded-2xl shadow-glow-lg">
            🔬 Get Started Free
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-2 border-t border-border py-8 text-center text-muted text-sm">
        © 2024 ResearchAI
      </footer>
    </div>
  )
}
