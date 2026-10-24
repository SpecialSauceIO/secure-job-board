import Link from 'next/link'
import Image from 'next/image'
import { LEGAL_CONFIG } from '@/constants/legal'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-300 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
        <Link
          href="/"
          className="flex items-center hover:opacity-90 transition-opacity shrink-0"
        >
          <Image
            src="/logo.png"
            alt="specialsauce.io Logo"
            width={340}
            height={85}
            className="h-11 sm:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
          />
        </Link>

        {/* Legal, Support Ticket Form & General Contact Links */}
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-x-5 gap-y-2">
          <Link
            href="/security"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
          >
            Security &amp; Trust
          </Link>
          <Link
            href="/terms"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Privacy Policy
          </Link>
          <Link
            href="/dashboard/support"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Help &amp; Support
          </Link>
          <a
            href={`mailto:${LEGAL_CONFIG.supportEmail}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Contact Us
          </a>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 text-center lg:text-right whitespace-nowrap shrink-0">
          © {new Date().getFullYear()} {LEGAL_CONFIG.legalEntityName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
