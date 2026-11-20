import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import W2HiringGuideView from "@/components/W2HiringGuideView"

export const metadata = {
  alternates: { canonical: "/w2-hiring" },
  title: "Direct Hire, W-2 Contract & Contract-to-Hire | Special Sauce",
  description:
    "How Direct Hire, W-2 Contract, and Contract-to-Hire ($0 conversion fee) work on Special Sauce.",
}

export default function W2HiringPublicPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <W2HiringGuideView isDashboard={false} />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
