import Link from 'next/link'
import Image from 'next/image'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-8 px-6 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row justify-between items-center gap-5">
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
    </footer>
  )
}
