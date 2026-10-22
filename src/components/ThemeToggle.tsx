'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  const toggleTheme = () => {
    const nextDark = !dark
    setDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      try {
        localStorage.setItem('ss_theme', 'dark')
      } catch {
        // ignore storage errors
      }
    } else {
      document.documentElement.classList.remove('dark')
      try {
        localStorage.setItem('ss_theme', 'light')
      } catch {
        // ignore storage errors
      }
    }
  }

  if (!mounted) return null

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border text-xs font-extrabold transition-all cursor-pointer select-none backdrop-blur-md bg-slate-900/90 text-amber-300 border-slate-700 hover:border-amber-400"
    >
      <span className="text-sm leading-none">{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}
