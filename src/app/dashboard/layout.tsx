import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardNav from '@/components/DashboardNav'
import {
  resolveCandidateTierInfo,
  resolveEmployerTierInfo,
} from '@/app/dashboard/actions'

export const dynamic = 'force-dynamic'

function isUserAdminOpsAuthorized(userEmail?: string | null): boolean {
  if (!userEmail) return false
  const lower = userEmail.trim().toLowerCase()

  const configuredAdmins = (process.env.ADMIN_OPS_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (configuredAdmins.length > 0) {
    return configuredAdmins.includes(lower)
  }

  // Default allowlist during pre-launch QA (plus any @specialsauce.io address)
  return (
    lower.endsWith('@specialsauce.io') ||
    lower.endsWith('@test.com') ||
    lower.includes('briley') ||
    lower.includes('admin')
  )
}

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
    tierLabel = `${tInfo.label} (${tInfo.maxSeats} ${
      tInfo.maxSeats === 1 ? 'Seat' : 'Seats'
    })`
  } else if (role === 'candidate') {
    const cInfo = await resolveCandidateTierInfo(user.id)
    tierLabel = cInfo.label
  }

  const showAdminOpsBar = isUserAdminOpsAuthorized(user.email)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Persistent Top Navigation Bar with Logo, Tagline, Security & Role Links */}
      <DashboardNav
        role={role}
        userEmail={user.email || ''}
        tierLabel={tierLabel}
        signOutAction={signOut}
      />

      {/* Slim Admin Operations Ribbon (Visible Only to Authorized Admin Accounts) */}
      {showAdminOpsBar && (
        <div className="bg-slate-900 border-b border-amber-500/40 px-4 sm:px-8 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-300">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300 uppercase tracking-wider">
                Admin Operations Mode
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline font-medium">
                Service Desk Work Items, Bug Triage &amp; Behavioral ToS Radar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/admin/ops"
                className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black tracking-tight transition-colors shadow-2xs"
              >
                ⚡ Open Ops &amp; Trust Command Center →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 p-8">{children}</main>

      {/* Subtle Dashboard Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Special Sauce. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {showAdminOpsBar && (
              <Link
                href="/dashboard/admin/ops"
                className="text-xs font-extrabold text-amber-600 hover:text-amber-800 transition-colors"
              >
                ⚡ Admin Ops &amp; Triage
              </Link>
            )}
            <Link
              href="/dashboard/support"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Help Center &amp; Playbooks
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