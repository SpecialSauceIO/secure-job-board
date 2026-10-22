import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
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
    supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single(),
    getUserOpsTickets(user.id, user.email),
  ])

  const userRole = profile?.role as 'candidate' | 'employer' | null
  const userName = profile?.full_name || user.email?.split('@')[0] || 'You'
  const requestedTicketId = resolvedParams?.ticket
    ? String(resolvedParams.ticket).toUpperCase().trim()
    : undefined
  const requestedRate = resolvedParams?.rate
    ? Number(resolvedParams.rate)
    : undefined

  const rawTab = resolvedParams?.tab
  const initialTab: 'ticket' | 'guides' | 'kb' | 'security' =
    rawTab === 'ticket' || requestedTicketId
      ? 'ticket'
      : rawTab === 'kb' || rawTab === 'security'
      ? rawTab
      : 'guides'

  return (
    <div className="max-w-6xl mx-auto py-3 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Help Center &amp; Support Desk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your live support conversations, submit a new ticket, or browse platform guides and security documentation.
          </p>
        </div>
      </header>

      <SupportCenterClient
        faqs={SUPPORT_FAQS}
        userRole={userRole}
        userName={userName}
        userEmail={user.email || ''}
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
  )
}
