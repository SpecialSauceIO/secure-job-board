import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import {
  resolveCandidateTierInfo,
  resolveEmployerTierInfo,
  claimInvitedOrganizationSeatIfAny,
} from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // MASTER AUTH GATE: Block all unauthenticated access to any /dashboard/* route
  if (!user) {
    redirect('/login')
  }

  async function signOut() {
    'use server'
    const supabaseAction = await createClient()
    await supabaseAction.auth.signOut()
    redirect('/login')
  }

  await claimInvitedOrganizationSeatIfAny(user.id, user.email)

  let role: 'candidate' | 'employer' | null = null
  let tierLabel = ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  role = (profile?.role as 'candidate' | 'employer' | null) || null

  if (role === 'employer') {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    let orgData = null
    if (member?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', member.organization_id)
        .single()
      orgData = org
    }

    const tInfo = await resolveEmployerTierInfo(orgData)
    const shortTierMap = { enterprise: "Enterprise Plan", growth: "Growth Plan", starter: "Starter Plan", free: "No Active Plan" }; const shortLabel = shortTierMap[tInfo.tier] || tInfo.label; const seatText = tInfo.tier === "free" ? "Select Tier" : (tInfo.maxSeats >= 100 ? "Unlimited Seats" : `${tInfo.maxSeats} ${tInfo.maxSeats === 1 ? "Seat" : "Seats"}`); tierLabel = `${shortLabel} · ${seatText}`
  } else if (role === 'candidate') {
    const cInfo = await resolveCandidateTierInfo(user.id)
    tierLabel = cInfo.tier === "prestige" || cInfo.tier === "pro" ? "★ Prestige Plan · Unlimited Apps" : cInfo.tier === "professional" || cInfo.tier === "trial" ? `★ Professional Plan · ${cInfo.freeAppsRemaining}/15 Apps` : cInfo.tier === "explorer" ? "★ Explorer Plan · Verified Vault" : "Unsubscribed · Select Plan"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Persistent Top Navigation Bar with Logo, Tagline, Security & Role Links */}
      <DashboardNav
        role={role}
        userEmail={user.email || ''}
        tierLabel={tierLabel}
        signOutAction={signOut}
      />

      {/* Main Page Content */}
      <main className="flex-1 px-4 py-6 sm:p-6 md:p-8">{children}</main>

      {/* Subtle Dashboard Footer */}
      <footer className="border-t border-slate-300 bg-white py-6 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Special Sauce. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2 text-center">
            <Link
              href="/dashboard/support"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Help Center &amp; Playbooks
            </Link>
            <Link
              href="/dashboard/workflows"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Platform Workflows
            </Link>
            <Link
              href="/dashboard/security"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Data Security &amp; Stripe Vault
            </Link>
            <Link
              href="/terms"
              className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}