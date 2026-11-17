import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import TalentShieldGuideView from "@/components/TalentShieldGuideView"

export const metadata = {
  title: "Employer Talent Shield Guide | Special Sauce",
  description:
    "How to vet external talent leads and inbound cold messages using single-use Employer Talent Shield verification links.",
}

export default async function DashboardTalentShieldGuidePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="py-2">
      <div className="max-w-5xl mx-auto py-3 space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/dashboard/employer/billing"
            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm inline-flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            ← Back to Membership &amp; Plan Settings
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/dashboard/employer/shield"
            className="text-emerald-600 dark:text-emerald-400 font-bold text-sm inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            Open Employer Talent Shield →
          </Link>
        </div>
        <TalentShieldGuideView isDashboard={true} />
      </div>
    </div>
  )
}
