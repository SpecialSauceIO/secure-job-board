'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function syncLogoImages(isDark: boolean) {
  if (typeof document === 'undefined') return
  const imgs = document.querySelectorAll<HTMLImageElement>('img[src*="logo"]')
  imgs.forEach((img) => {
    const currentSrc = img.getAttribute('src') || ''
    if (isDark) {
      if (currentSrc.includes('logo') && !currentSrc.includes('logo-dark')) {
        img.removeAttribute('srcset')
        img.setAttribute('src', '/logo-dark.png')
      }
    } else {
      if (currentSrc.includes('logo-dark')) {
        img.removeAttribute('srcset')
        img.setAttribute('src', '/logo.png')
      }
    }
  })
}

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

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
  }, [pathname])

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

  // Inside /dashboard, the toggle lives inside the Accessibility profile dropdown menu
  if (!mounted || pathname?.startsWith('/dashboard')) return null

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
      className="fixed bottom-[76px] right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border text-xs font-extrabold transition-all cursor-pointer select-none backdrop-blur-md bg-slate-900/90 text-amber-300 border-slate-700 hover:border-amber-400"
    >
      <span className="text-sm leading-none">{dark ? '☀️' : '🌙'}</span>
      <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}
