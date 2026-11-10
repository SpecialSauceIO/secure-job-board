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
              href="/faq"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              FAQ
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
        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <a href="https://www.linkedin.com/company/specialsauceio/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">LinkedIn</a>
          <a href="https://x.com/specialsauceio" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">X</a>
          <a href="https://www.youtube.com/channel/UCIAZM_kRqw0t1aPn1UFvneQ" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">YouTube</a>
          <a href="https://www.instagram.com/specialsauce.io/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">Instagram</a>
          <a href="https://www.facebook.com/profile.php?id=61595271106490" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-white transition-colors">Facebook</a>
        </div>
      </div>
    </footer>
  )
}
