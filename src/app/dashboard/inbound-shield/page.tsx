import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import InboundShieldGuideView from "@/components/InboundShieldGuideView"

export const metadata = {
  title: "Personal Inbound Shield Guide | Special Sauce",
  description:
    "How to vet cold recruiter messages privately using single-use Personal Inbound Shield verification links.",
}

export default async function DashboardInboundShieldGuidePage() {
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
            href="/dashboard/billing"
            className="text-indigo-600 dark:text-indigo-400 font-bold text-sm inline-flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            ← Back to Membership &amp; Plan Settings
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/dashboard/shield"
            className="text-emerald-600 dark:text-emerald-400 font-bold text-sm inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
          >
            Open Personal Inbound Shield →
          </Link>
        </div>
        <InboundShieldGuideView isDashboard={true} />
      </div>
    </div>
  )
}
