import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import InboundShieldGuideView from "@/components/InboundShieldGuideView"

export const metadata = {
  alternates: { canonical: "/inbound-shield" },
  title: "Personal Inbound Shield | Special Sauce",
  description:
    "How verified Professionals use single-use Personal Inbound Shield verification links to vet cold recruiter messages without exposing their identity or current job.",
}

export default function InboundShieldPublicPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <InboundShieldGuideView isDashboard={false} />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
