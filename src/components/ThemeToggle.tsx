'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isDashboard = Boolean(pathname?.startsWith('/dashboard'))

  useEffect(() => {
    setMounted(true)
    const syncThemeForRoute = () => {
      if (!isDashboard) {
        if (!document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.add('dark')
        }
      } else {
        const preferredDark = resolvePreferredThemeIsDark()
        if (preferredDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    syncThemeForRoute()
    window.addEventListener('ss-theme-change', syncThemeForRoute)

    const htmlObserver = new MutationObserver(() => {
      const expectedDark = isDashboard ? resolvePreferredThemeIsDark() : true
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
      window.removeEventListener('ss-theme-change', syncThemeForRoute)
      htmlObserver.disconnect()
    }
  }, [pathname, isDashboard])

  if (!mounted || isDashboard || pathname === '/security') return null

  return (
    <div className="fixed bottom-28 right-6 z-50 hidden sm:flex flex-col items-end">
      <Link
        href="/security"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/95 backdrop-blur text-white border border-slate-700 shadow-lg hover:bg-indigo-600 hover:border-indigo-500 text-xs font-extrabold transition-all cursor-pointer group"
      >
        <span>🛡️ Security &amp; Trust</span>
        <svg
          className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  )
}
