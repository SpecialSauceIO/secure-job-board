import Link from 'next/link'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-6 px-6 w-full overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
          {/* Left: Corporate Address & General Inquiry Email */}
          <p className="text-xs sm:text-sm font-medium text-slate-600 text-center xl:text-left shrink-0 whitespace-nowrap">
            {LEGAL_CONFIG.legalEntityAddress.replace(' US', '')} •{' '}
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>
          </p>

          {/* Center: Public Security & Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
          </div>

          {/* Right: Copyright Notice */}
          <p className="text-xs sm:text-sm font-medium text-slate-600 text-center xl:text-right shrink-0 whitespace-nowrap">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
