import { useState } from 'react'
import { motion } from 'framer-motion'
import API from '../api'
import { toast } from '../components/Toast'

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) return toast('Please fill in all fields', 'error')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('username', form.email)
      fd.append('password', form.password)
      const res = await fetch(`${API}/login`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('username', data.username || form.email.split('@')[0])
      toast('Login successful!', 'success')
      onLogin()
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  async function handleSignup(e) {
    e.preventDefault()
    if (!form.username || !form.email || !form.password || !form.confirm) return toast('Please fill in all fields', 'error')
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error')
    if (form.password !== form.confirm) return toast('Passwords do not match', 'error')
    setLoading(true)
    try {
      const res = await fetch(`${API}/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.username, email: form.email, password: form.password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Signup failed')
      toast('Account created! Please login.', 'success')
      setMode('login')
    } catch (err) { toast(err.message, 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      {/* Background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-purple/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-pink/10 blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan/5 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-2xl p-10 w-full max-w-md shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <motion.div whileHover={{ scale: 1.1 }} className="text-4xl mb-3">🔬</motion.div>
          <h1 className="text-2xl font-bold text-purple">ResearchAI</h1>
          <p className="text-sub text-sm mt-2">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</p>
          <p className="text-muted text-xs mt-1">{mode === 'login' ? 'Login to continue analyzing research papers' : 'Join ResearchAI today'}</p>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="text-sm font-semibold text-white block mb-1">Username</label>
              <input className="input-field" type="text" placeholder="Enter your username" value={form.username} onChange={set('username')} />
            </motion.div>
          )}
          <div>
            <label className="text-sm font-semibold text-white block mb-1">Email</label>
            <input className="input-field" type="email" placeholder="Enter your email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="text-sm font-semibold text-white block mb-1">Password</label>
            <input className="input-field" type="password" placeholder="Enter your password" value={form.password} onChange={set('password')} />
          </div>
          {mode === 'signup' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="text-sm font-semibold text-white block mb-1">Confirm Password</label>
              <input className="input-field" type="password" placeholder="Confirm your password" value={form.confirm} onChange={set('confirm')} />
            </motion.div>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="grad-btn w-full py-3 mt-2 text-base">
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </motion.button>
        </form>

        <p className="text-center text-sub text-sm mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-purple font-semibold hover:text-pink transition-colors">
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
