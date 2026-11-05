import Link from 'next/link'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-5 px-6 w-full overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col xl:grid xl:grid-cols-3 items-center gap-4 text-xs font-medium text-slate-500">
          {/* Left: 3-Line Corporate Address & General Inquiry Email */}
          <div className="text-xs font-medium text-slate-500 text-center xl:text-left xl:justify-self-start leading-tight space-y-1">
            <p className="whitespace-nowrap">5900 Balcones Dr #34619</p>
            <p className="whitespace-nowrap">Austin, TX 78731</p>
            <p className="whitespace-nowrap">
              <a
                href={`mailto:${LEGAL_CONFIG.supportEmail}`}
                className="text-slate-500 hover:text-slate-900 transition-colors underline-offset-4 hover:underline"
              >
                {LEGAL_CONFIG.supportEmail}
              </a>
            </p>
          </div>

          {/* Center: Public Security & Legal Links (true geometric center via grid-cols-3) */}
          <div className="flex flex-wrap items-center justify-center xl:justify-self-center gap-x-6 gap-y-2">
            <Link
              href="/security"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Security &amp; Trust
            </Link>
            <Link
              href="/terms"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Right: Copyright Notice */}
          <p className="text-xs font-medium text-slate-500 text-center xl:text-right xl:justify-self-end whitespace-nowrap">
            © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
