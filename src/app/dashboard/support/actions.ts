'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  getUserOpsTickets,
  appendUserTicketReply,
  type UserVisibleTicket,
} from '@/lib/ops-bridge'

export async function fetchMySupportTicketsAction(): Promise<{
  tickets: UserVisibleTicket[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { tickets: [], error: 'Not authenticated' }
  }

  const tickets = await getUserOpsTickets(user.id, user.email)
  return { tickets }
}

export async function replyToSupportTicketAction(
  ticketId: string,
  replyText: string
): Promise<{
  ok: boolean
  error?: string
  tickets?: UserVisibleTicket[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'You must be signed in to reply to a ticket.' }
  }

  const res = await appendUserTicketReply({
    ticketId,
    userId: user.id,
    userEmail: user.email || '',
    replyText,
  })

  if (!res.ok) {
    return { ok: false, error: res.error || 'Could not post reply.' }
  }

  const resendKey = (process.env.RESEND_API_KEY || '').trim()
  if (resendKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Special Sauce Support <support@specialsauce.io>',
          to: ['support@specialsauce.io'],
          subject: `[${ticketId}] In-App Reply from ${user.email}`,
          text: `Customer ${user.email} replied in-app to ticket ${ticketId} (Status set to Pending Support):\n\n${replyText.trim()}`,
        }),
      })
    } catch {}
  }

  revalidatePath('/dashboard/support')
  const tickets = await getUserOpsTickets(user.id, user.email)
  return { ok: true, tickets }
}
