import Link from 'next/link'
import Image from 'next/image'

export function PublicHeader({
  fixed = false,
}: {
  fixed?: boolean
}) {
  return (
    <nav
      className={`${
        fixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-40 bg-white/85 backdrop-blur-md border-b border-slate-300`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-24 flex items-center justify-between relative">
        {/* LEFT: Clickable Full-Size Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-14 sm:h-16 md:h-[72px] w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* CENTERED: Tagline */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-4 pointer-events-none">
          <span className="h-5 w-px bg-slate-200"></span>
          <p className="text-sm font-light text-slate-700 tracking-[0.03em] lowercase whitespace-nowrap">
            securely connecting professionals and employers
          </p>
          <span className="h-5 w-px bg-slate-200"></span>
        </div>

        {/* RIGHT: Pricing & Perks, Sign In & Get Started */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          <Link
            href="/pricing"
            className="hidden sm:inline text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            Pricing &amp; Perks
          </Link>
          <Link
            href="/login"
            className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
