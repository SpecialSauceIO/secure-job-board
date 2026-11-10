import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { SecurityTrustClient } from "@/components/SecurityTrustClient"

export const metadata = {
  alternates: { canonical: "/security" },
  title: "Security & Privacy",
  description: "How Special Sauce protects your identity, resume, and time\u2014with both a plain-language overview and full AES-256, TLS 1.3, Stripe Identity, and RLS technical specifications.",
}

export default function SecurityTrustPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col justify-between">
      <PublicHeader />
      <div className="flex-1">
        <SecurityTrustClient />
      </div>
      <PublicFooter />
    </div>
  )
}
