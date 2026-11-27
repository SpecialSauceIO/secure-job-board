import { redirect } from 'next/navigation'

export default function LegacyDashboardWorkflowsRedirectPage() {
  redirect('/dashboard/how-it-works')
}
