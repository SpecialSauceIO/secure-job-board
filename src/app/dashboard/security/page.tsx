import { redirect } from 'next/navigation'

export default function DataSecurityRedirectPage() {
  redirect('/dashboard/support?tab=security')
}
