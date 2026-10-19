import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { SubmitButton } from '@/components/SubmitButton'

export async function InviteRecruiterForm() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the current employer's organization ID
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  // If they haven't set up an organization yet, don't show the form
  if (!member?.organization_id) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
        <p className="text-sm text-yellow-800 font-medium">
          You must set up your Company Profile before you can invite team members.
        </p>
      </div>
    )
  }

  // INLINE SERVER ACTION: No separate file needed!
  async function inviteRecruiter(formData: FormData) {
    'use server'
    
    const email = formData.get('email') as string
    const organizationId = formData.get('organizationId') as string

    if (!email || !organizationId) return

    const supabaseAction = await createClient()

    const { data: invite, error } = await supabaseAction
      .from('organization_invites')
      .insert({
        email: email.toLowerCase(),
        organization_id: organizationId,
        role: 'recruiter'
      })
      .select('token')
      .single()

    if (error) {
      console.error('Invite error:', error)
      return
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteLink = `${siteUrl}/accept-invite?token=${invite.token}`

    console.log('DEV ONLY - Email this Invite Link to the recruiter:', inviteLink)

    revalidatePath('/dashboard/employer/organization')
  }

  return (
    <form action={inviteRecruiter} className="flex flex-col sm:flex-row gap-3 items-end p-6 bg-gray-50 rounded-lg border border-slate-300 shadow-sm mb-8">
      <input type="hidden" name="organizationId" value={member.organization_id} />
      
      <div className="flex-1 w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Recruiter Email Address
        </label>
        <input 
          type="email" 
          name="email" 
          required 
          placeholder="colleague@company.com" 
          className="w-full rounded-md border-gray-300 bg-white text-gray-900 py-2 px-3 shadow-sm focus:border-indigo-500" 
        />
      </div>
      
      <SubmitButton 
        pendingText="Sending..." 
        className="w-full sm:w-auto bg-indigo-600 px-6 py-2 text-white font-bold rounded-md hover:bg-indigo-500 shadow-sm"
      >
        Send Invite
      </SubmitButton>
    </form>
  )
}