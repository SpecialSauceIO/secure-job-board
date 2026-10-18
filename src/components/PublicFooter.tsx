import Link from 'next/link'
import Image from 'next/image'

export function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <Link
          href="/"
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="specialsauce.io Logo"
            width={340}
            height={85}
            className="h-12 sm:h-14 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300"
          />
        </Link>

        {/* Legal & Documentation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            Pricing &amp; Perks
          </Link>
          <Link
            href="/security"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Security &amp; Trust
          </Link>
          <Link
            href="/terms"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} specialsauce.io. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
