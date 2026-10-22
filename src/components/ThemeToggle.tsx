'use client'

import { useEffect, useState } from 'react'

function syncLogoImages(isDark: boolean) {
  if (typeof document === 'undefined') return
  const imgs = document.querySelectorAll<HTMLImageElement>('img[src*="logo"]')
  imgs.forEach((img) => {
    const currentSrc = img.getAttribute('src') || ''
    if (isDark) {
      if (currentSrc === '/logo.png' || currentSrc === '/logo.jpg') {
        img.setAttribute('src', '/logo-dark.png')
      }
    } else {
      if (currentSrc === '/logo-dark.png') {
        img.setAttribute('src', '/logo.png')
      }
    }
  })
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
    syncLogoImages(isDark)

    const onThemeChange = () => {
      const nowDark = document.documentElement.classList.contains('dark')
      setDark(nowDark)
      syncLogoImages(nowDark)
    }

    window.addEventListener('ss-theme-change', onThemeChange)

    const observer = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains('dark')
      syncLogoImages(nowDark)
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('ss-theme-change', onThemeChange)
      observer.disconnect()
    }
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
    syncLogoImages(nextDark)
    window.dispatchEvent(new Event('ss-theme-change'))
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
