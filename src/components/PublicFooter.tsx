import Link from 'next/link'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-6 px-6 w-full overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
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

          {/* Public Legal, Security & Workflow Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
          </div>

          <p className="text-xs sm:text-sm font-medium text-slate-600 text-center xl:text-right shrink-0 whitespace-nowrap">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName} • Austin, TX •{' '}
            <a
              href={`mailto:${LEGAL_CONFIG.supportEmail}`}
              className="hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
            >
              {LEGAL_CONFIG.supportEmail}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
