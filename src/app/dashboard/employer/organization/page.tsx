import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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
  cleanDescription: string
} {
  const raw = rawDescription || ''
  const indMatch = raw.match(/\[IND:([^\]]+)\]/i)
  const sizeMatch = raw.match(/\[SIZE:([^\]]+)\]/i)

  const extractedIndustry = indMatch?.[1]
    ? normalizeIndustryVertical(indMatch[1].trim())
    : 'Technology, Software & SaaS'

  const extractedSize = sizeMatch?.[1]
    ? sizeMatch[1].trim()
    : 'Growth (50–250 Employees)'

  // Strip [IND:...], [SIZE:...], and [ATS_CFG:...] metadata tags so the form textarea stays clean
  const cleanDescription = raw
    .replace(/\s*\[IND:[^\]]*\]/gi, '')
    .replace(/\s*\[SIZE:[^\]]*\]/gi, '')
    .replace(/\s*\[ATS_CFG:[A-Za-z0-9+/=]+\]/gi, '')
    .trim()

  return {
    industry_vertical: extractedIndustry,
    company_size: extractedSize,
    cleanDescription,
  }
}

export default async function EmployerOrganizationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

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
      const strippedTierAndSeats = await stripTierTag(orgData.description)
      const { industry_vertical, company_size, cleanDescription } =
        extractOrgIndustryAndSize(strippedTierAndSeats)

      cleanOrgForForm = {
        ...orgData,
        industry_vertical:
          orgData.industry_vertical ||
          orgData.industry ||
          industry_vertical,
        company_size: orgData.company_size || company_size,
        description: cleanDescription,
      }
    }
  }

  // IMPORTANT: Resolve tier info from rawOrgData BEFORE stripping [TIER:...] tags!
  const tierInfo = await resolveEmployerTierInfo(rawOrgData)
  const seats = await getOrganizationSeats()

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Company Profile, Seats &amp; ATS Integrations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify your corporate domain, configure your Primary Industry Vertical, manage collaborator seats, and connect Workday or Greenhouse.
          </p>
        </div>

        <Link
          href="/dashboard/employer/billing"
          className="shrink-0 inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition-colors"
        >
          Manage Plan &amp; Credits →
        </Link>
      </header>

      <EmployerOrganizationForm
        initialOrg={cleanOrgForForm}
        userEmail={user.email || ''}
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