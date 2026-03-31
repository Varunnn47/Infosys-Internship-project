import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let toastFn = null

export function useToast() {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  useEffect(() => { toastFn = toast }, [toast])
  return { toasts, toast }
}

export function toast(msg, type = 'info') { toastFn?.(msg, type) }

const colors = { success: 'bg-success', error: 'bg-error', info: 'bg-purple', warning: 'bg-warning' }

export function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 120, opacity: 0 }}
            className={`${colors[t.type]} text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-lg max-w-sm`}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
