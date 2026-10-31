import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { runTrueHorizonScanAction } from './actions'
import TrueHorizonClient from '@/components/TrueHorizonClient'
import { isTrueHorizonDlcEnabled } from '@/lib/true-horizon-engine'

export const dynamic = 'force-dynamic'

export default async function TrueHorizonPage() {
  if (!isTrueHorizonDlcEnabled()) {
    redirect('/dashboard')
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const res = await runTrueHorizonScanAction()
  if (res.error || !res.data || !res.profileSummary) {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8">
      <TrueHorizonClient
        initialAnalysis={res.data}
        initialProfileSummary={res.profileSummary}
      />
    </div>
  )
}
