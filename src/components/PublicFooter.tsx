import Link from 'next/link'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-8 px-6 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Global Operational Provenance & Trust Bar — Frameless with Thin Vertical Borders */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-6 border-b border-slate-200/80 text-xs">
          <div className="flex flex-wrap items-center justify-center lg:justify-start">
            <span className="px-3.5 py-0.5 border-l border-r border-slate-400 dark:border-white/70 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">
              100% US-Based Company &amp; Operations
            </span>
            <span className="px-3.5 py-0.5 border-r border-slate-400 dark:border-white/70 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">
              100% US Human Support
            </span>
            <span className="px-3.5 py-0.5 border-r border-slate-400 dark:border-white/70 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200">
              AI Tooling Calibrated Daily
            </span>
          </div>
          <Link
            href="/security"
            className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#0077D4] hover:underline whitespace-nowrap"
          >
            Verify Our Security &amp; AI Standards →
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-center gap-5">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src="/logo.png?v=20261024"
              alt="specialsauce.io Logo"
              width={280}
              height={70}
              className="h-9 sm:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
            />
          </Link>

          {/* Legal, Workflows & Help Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              href="/workflows"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Platform Workflows
            </Link>
            <Link
              href="/security"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Security &amp; Trust
            </Link>
            <Link
              href="/terms"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
            <Link
              href="/dashboard/support"
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Help &amp; Support
            </Link>
          </div>

          <p className="text-xs text-slate-500 text-center xl:text-right shrink-0">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
