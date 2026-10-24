import Link from 'next/link'

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
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-24 flex items-center justify-between gap-4">
        {/* LEFT: Clickable Full-Size Logo */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src="/logo.png"
              alt="specialsauce.io Logo"
              width={420}
              height={105}
              className="h-13 sm:h-15 md:h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* CENTER: Tagline centered in the exact available space between Logo and Home */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-3.5 pointer-events-none px-4 min-w-0">
          <span className="h-5 w-px bg-slate-400 shrink-0"></span>
          <p className="text-[11px] font-semibold text-slate-700 tracking-[0.13em] uppercase whitespace-nowrap">
            SECURELY CONNECTING PROFESSIONALS &amp; EMPLOYERS
          </p>
          <span className="h-5 w-px bg-slate-400 shrink-0"></span>
        </div>

        {/* RIGHT: Navigation Links & Sign In */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link
            href="/"
            className="hidden md:inline text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >
            Home
          </Link>
          <Link
            href="/workflows"
            className="hidden sm:inline text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="hidden sm:inline text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
          >
            Pricing &amp; Perks
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 text-slate-800 hover:text-indigo-600 text-sm font-bold transition-all shadow-2xs whitespace-nowrap"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  )
}
