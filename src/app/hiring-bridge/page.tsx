import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import TalentShieldGuideView from "@/components/TalentShieldGuideView"

export const metadata = {
  alternates: { canonical: "/hiring-bridge" },
  title: "Verified Hiring Bridge | Special Sauce",
  description:
    "Stop applicant spam on LinkedIn and your careers page. Verified Hiring Bridge brings only ID-verified humans ($0 to applicants) who clear your 40%+ TrueFit Score™ into your pipeline.",
}

export default function HiringBridgePublicPage() {
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
