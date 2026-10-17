import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EmployerOrganizationForm from '@/components/EmployerOrganizationForm'
import EmployerTeamSeatsPanel from '@/components/EmployerTeamSeatsPanel'
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

  const cleanDescription = raw
    .replace(/\s*\[IND:[^\]]*\]/gi, '')
    .replace(/\s*\[SIZE:[^\]]*\]/gi, '')
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
            Back to Employer Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Company Profile &amp; Domain Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Verify your corporate domain, configure your Primary Industry Vertical, and manage delegated seats for internal hiring managers and W-2 BPO partners.
          </p>
        </header>

        <EmployerOrganizationForm
          initialOrg={cleanOrgForForm}
          userEmail={user.email || ''}
        />

        {cleanOrgForForm && (
          <EmployerTeamSeatsPanel
            orgName={cleanOrgForForm.name || 'Your Organization'}
            tier={tierInfo.tier}
            tierLabel={tierInfo.label}
            maxSeats={tierInfo.maxSeats}
            initialSeats={seats}
          />
        )}
      </div>
    </div>
  )
}