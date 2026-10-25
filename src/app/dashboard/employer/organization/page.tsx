import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Stripe from 'stripe'
import EmployerOrganizationForm from '@/components/EmployerOrganizationForm'
import EmployerTeamSeatsPanel from '@/components/EmployerTeamSeatsPanel'
import EnterpriseAtsIntegrationPanel from '@/components/EnterpriseAtsIntegrationPanel'
import {
  resolveEmployerTierInfo,
  stripTierTag,
  getOrganizationSeats,
} from '@/app/dashboard/actions'
import { normalizeIndustryVertical } from '@/constants/industries'

export const dynamic = 'force-dynamic'

function extractOrgIndustryAndSize(rawDescription?: string | null): {
  industry_vertical: string
  company_size: string
  ein: string
  incorporation_state: string
  rdap_status: string
  cleanDescription: string
} {
  const raw = rawDescription || ''
  const indMatch = raw.match(/\[IND:([^\]]+)\]/i)
  const sizeMatch = raw.match(/\[SIZE:([^\]]+)\]/i)
  const einMatch = raw.match(/\[EIN:([^\]]+)\]/i)
  const stateMatch = raw.match(/\[INC_STATE:([^\]]+)\]/i)
  const rdapMatch = raw.match(/\[RDAP:([^\]]+)\]/i)

  const extractedIndustry = indMatch?.[1]
    ? normalizeIndustryVertical(indMatch[1].trim())
    : 'Technology, Software & SaaS'

  const extractedSize = sizeMatch?.[1]
    ? sizeMatch[1].trim()
    : 'Growth (50–250 Employees)'

  const ein = einMatch?.[1]?.trim() || ''
  const incorporation_state = stateMatch?.[1]?.trim() || ''
  const rdap_status = rdapMatch?.[1]?.trim() || ''

  const cleanDescription = raw
    .replace(/\s*\[IND:[^\]]*\]/gi, '')
    .replace(/\s*\[SIZE:[^\]]*\]/gi, '')
    .replace(/\s*\[EIN:[^\]]*\]/gi, '')
    .replace(/\s*\[INC_STATE:[^\]]*\]/gi, '')
    .replace(/\s*\[RDAP:[^\]]*\]/gi, '')
    .replace(/\s*\[ATS_CFG:[A-Za-z0-9+/=]+\]/gi, '')
    .trim()

  return {
    industry_vertical: extractedIndustry,
    company_size: extractedSize,
    ein,
    incorporation_state,
    rdap_status,
    cleanDescription,
  }
}

export default async function EmployerOrganizationPage({
  searchParams,
}: {
  searchParams?: Promise<{ verification?: string; session_id?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('role, identity_verified, is_verified')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

  // Sync Stripe Identity if returning from Stripe flow
  const isReturningFromStripe = Boolean(
    resolvedParams?.verification === 'pending' || resolvedParams?.session_id
  )
  const stripeKey =
    process.env.STRIPE_IDENTITY_SECRET_KEY || process.env.STRIPE_SECRET_KEY

  if (isReturningFromStripe && stripeKey) {
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2026-09-30.endive' as any,
      })
      const isTestKey = stripeKey.includes('_test_')
      const isCompletedStatus = (status?: string) =>
        status === 'verified' || (isTestKey && status === 'processing')
      const belongsToCurrentUser = (s: any) =>
        s &&
        (s.metadata?.userId === user.id ||
          s.metadata?.user_id === user.id ||
          s.client_reference_id === user.id)

      const cookieStore = await cookies()
      const cookieSessionId =
        cookieStore.get('stripe_vs_id')?.value || resolvedParams?.session_id

      let matchedSession: any = null
      if (cookieSessionId) {
        try {
          const retrieved =
            await stripe.identity.verificationSessions.retrieve(cookieSessionId)
          if (
            belongsToCurrentUser(retrieved) &&
            isCompletedStatus(retrieved.status)
          ) {
            matchedSession = retrieved
          }
        } catch {}
      }

      if (!matchedSession) {
        try {
          const sessions = await stripe.identity.verificationSessions.list({
            limit: 10,
          })
          matchedSession = sessions.data.find(
            (s) => belongsToCurrentUser(s) && isCompletedStatus(s.status)
          )
        } catch {}
      }

      if (matchedSession) {
        await supabase
          .from('profiles')
          .update({ identity_verified: true, is_verified: true })
          .eq('id', user.id)
        profile = {
          ...profile,
          identity_verified: true,
          is_verified: true,
        }
      }
    } catch {}
  }

  const isAdminIdVerified = Boolean(
    profile?.identity_verified === true ||
      String(profile?.identity_verified) === 'true' ||
      profile?.is_verified === true ||
      String(profile?.is_verified) === 'true'
  )

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  let rawOrgData: any = null
  let cleanOrgForForm: any = null

  if (member?.organization_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', member.organization_id)
      .single()

    if (orgData) {
      rawOrgData = orgData
      const {
        industry_vertical,
        company_size,
        ein,
        incorporation_state,
        rdap_status,
      } = extractOrgIndustryAndSize(orgData.description)
      const strippedAllTags = await stripTierTag(orgData.description)
      const { cleanDescription } = extractOrgIndustryAndSize(strippedAllTags)

      cleanOrgForForm = {
        ...orgData,
        industry_vertical:
          orgData.industry_vertical || orgData.industry || industry_vertical,
        company_size: orgData.company_size || company_size,
        ein,
        incorporation_state,
        rdap_status,
        description: cleanDescription,
      }
    }
  }

  const tierInfo = await resolveEmployerTierInfo(rawOrgData)
  const seats = await getOrganizationSeats()

  return (
    <div className="max-w-6xl mx-auto py-3 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-300">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Company Profile, 3-Pillar Trust Gate &amp; Team Seats
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete your 3-Pillar Employer Trust Verification (Corporate Domain + 90-Day RDAP Age Check, Federal EIN Attestation, and Admin Stripe Identity) to publish roles and pitch candidates.
          </p>
        </div>

        <Link
          href="/dashboard/employer/billing"
          className="shrink-0 inline-flex items-center px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors border-slate-300"
        >
          Manage Plan &amp; Credits →
        </Link>
      </header>

      <EmployerOrganizationForm
        initialOrg={cleanOrgForForm}
        userEmail={user.email || ''}
        initialAdminIdVerified={isAdminIdVerified}
      />

      {cleanOrgForForm && (
        <>
          <EmployerTeamSeatsPanel
            orgName={cleanOrgForForm.name || 'Your Organization'}
            tier={tierInfo.tier}
            tierLabel={tierInfo.label}
            maxSeats={tierInfo.maxSeats}
            initialSeats={seats}
          />

          <EnterpriseAtsIntegrationPanel />
        </>
      )}
    </div>
  )
}
