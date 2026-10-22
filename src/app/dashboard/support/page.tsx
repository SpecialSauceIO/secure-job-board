import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SupportCenterClient from '@/components/SupportCenterClient'
import { SUPPORT_FAQS } from '@/constants/faqs'
import { getUserOpsTickets } from '@/lib/ops-bridge'

export const dynamic = 'force-dynamic'

export default async function SupportPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string
    ticket?: string
    rate?: string
  }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = searchParams ? await searchParams : {}

  const [{ data: profile }, initialTickets] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    getUserOpsTickets(user.id, user.email),
  ])

  const userRole = profile?.role as 'candidate' | 'employer' | null
  const requestedTicketId = resolvedParams?.ticket
    ? String(resolvedParams.ticket).toUpperCase().trim()
    : undefined
  const requestedRate = resolvedParams?.rate
    ? Number(resolvedParams.rate)
    : undefined
  const initialTab =
    resolvedParams?.tab === 'ticket' || requestedTicketId
      ? 'ticket'
      : 'guides'

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <Link
            href="/dashboard"
            className="text-indigo-600 font-bold text-sm inline-flex items-center gap-1 mb-3 hover:text-indigo-700"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Help Center &amp; Support
          </h1>
          <p className="text-slate-500 mt-1">
            Find answers in our knowledge base, manage your active support threads, or submit a ticket directly to the platform team.
          </p>
        </header>

        <SupportCenterClient
          faqs={SUPPORT_FAQS}
          userRole={userRole}
          initialTab={initialTab}
          initialTickets={initialTickets}
          initialSelectedTicketId={requestedTicketId}
          initialCsatRating={
            requestedRate && requestedRate >= 1 && requestedRate <= 5
              ? requestedRate
              : undefined
          }
        />
      </div>
    </div>
  )
}
