import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">404 Page Not Found</p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">We could not find that page on SpecialSauce.io</h1>
      <p className="text-slate-400 max-w-md mb-8 text-sm sm:text-base">
        The link may have moved or no longer exists. Explore open roles, pricing, or how SpecialSauce.io works below.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/" className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
          Back to Home
        </Link>
        <Link href="/pricing" className="px-5 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 text-sm font-semibold transition-colors">
          View Pricing
        </Link>
      </div>
    </main>
  );
}
