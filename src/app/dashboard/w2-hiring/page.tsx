import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import W2HiringGuideView from "@/components/W2HiringGuideView"

export const metadata = {
  title: "Built-In W-2 Employer of Record (EOR) & 4 Hiring Paths | Special Sauce",
  description:
    "Visual guide to Full-Time Direct Hire, W-2 Contract-to-Hire ($0 conversion fee), Limited W-2 Contract, and Indefinite W-2 Contract with built-in U.S. Employer of Record services.",
}

export default async function DashboardW2HiringGuidePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="py-2">
      <div className="max-w-6xl mx-auto py-3 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard"
            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm inline-flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/dashboard/support"
            className="text-emerald-600 dark:text-emerald-400 font-bold text-sm inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            Open Support Center →
          </Link>
        </div>
        <W2HiringGuideView isDashboard={true} />
      </div>
    </div>
  )
}
