'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function syncLogoImages(_isDark?: boolean) {
  // Unified /logo.png is used across both light and dark themes
}

export function resolvePreferredThemeIsDark(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const saved = localStorage.getItem('ss_theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    const match = document.cookie.match(/(?:^|; )ss_theme=([^;]*)/)
    if (match) {
      const val = decodeURIComponent(match[1])
      if (val === 'dark') return true
      if (val === 'light') return false
    }
  } catch {}
  return true
}

export function applyPreferredTheme(isDark: boolean) {
  if (typeof document === 'undefined') return
  if (isDark) {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark')
    }
    try {
      localStorage.setItem('ss_theme', 'dark')
      document.cookie = 'ss_theme=dark; path=/; max-age=31536000; SameSite=Lax'
    } catch {}
  } else {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('ss_theme', 'light')
      document.cookie = 'ss_theme=light; path=/; max-age=31536000; SameSite=Lax'
    } catch {}
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const preferredDark = resolvePreferredThemeIsDark()
    applyPreferredTheme(preferredDark)
    setDark(preferredDark)

    const onThemeChange = () => {
      const nowDark = resolvePreferredThemeIsDark()
      applyPreferredTheme(nowDark)
      setDark(nowDark)
    }

    window.addEventListener('ss-theme-change', onThemeChange)

    const htmlObserver = new MutationObserver(() => {
      const expectedDark = resolvePreferredThemeIsDark()
      const hasDarkClass = document.documentElement.classList.contains('dark')
      if (expectedDark !== hasDarkClass) {
        if (expectedDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    })
    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      window.removeEventListener('ss-theme-change', onThemeChange)
      htmlObserver.disconnect()
    }
  }, [pathname])

  const toggleTheme = () => {
    const nextDark = !dark
    setDark(nextDark)
    applyPreferredTheme(nextDark)
    window.dispatchEvent(new Event('ss-theme-change'))
  }

  // Inside /dashboard, the toggle lives inside the Accessibility profile dropdown menu
  if (!mounted || pathname?.startsWith('/dashboard')) return null

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
      className="fixed bottom-[76px] right-6 z-50 hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border text-xs font-extrabold transition-all cursor-pointer select-none backdrop-blur-md bg-slate-900/90 text-amber-300 border-slate-700 hover:border-amber-400"
    >
      <span className="text-sm leading-none">{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}
