import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import TalentShieldGuideView from "@/components/TalentShieldGuideView"

export const metadata = {
  alternates: { canonical: "/talent-shield" },
  title: "Verified Hiring Bridge | Special Sauce",
  description:
    "How verified Employers use single-use Verified Hiring Bridge links to vet external LinkedIn, GitHub, careers page, and inbound leads with Stripe ID and 40%+ TrueFit checks.",
}

export default function TalentShieldPublicPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <main className="flex-1 py-10 sm:py-14 px-4 sm:px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <TalentShieldGuideView isDashboard={false} />
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
