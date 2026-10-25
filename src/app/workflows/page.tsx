import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import PlatformWorkflowsView from '@/components/PlatformWorkflowsView'

export const metadata = {
  title: 'Platform Workflows: Candidate & Employer Onboarding | specialsauce.io',
  description:
    'Side-by-side visual walkthrough of the Special Sauce Candidate and Employer workflows: from enrollment and 3-Pillar verification to active job search, role publishing, and passive talent discovery.',
}

export default function PublicWorkflowsPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <div>
        <PublicHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
          <PlatformWorkflowsView isDashboard={false} />
        </main>
      </div>
      <PublicFooter />
    </div>
  )
}
