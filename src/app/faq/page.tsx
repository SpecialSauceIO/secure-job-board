import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import PublicFaqClient from '@/components/PublicFaqClient'
import { SUPPORT_FAQS } from '@/constants/faqs'
import { getMergedPublicSupportFaqs } from '@/lib/ops-bridge'
export const dynamic = 'force-dynamic'
export const metadata = {
  alternates: { canonical: "/faq" }, title: 'Frequently Asked Questions | Special Sauce™' }
export default async function PublicFaqPage() {
  const liveFaqs = await getMergedPublicSupportFaqs(SUPPORT_FAQS)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicHeader />
      <main className="flex-1"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: liveFaqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }) }} />
      <PublicFaqClient faqs={liveFaqs} /></main>
      <PublicFooter />
    </div>
  )
}
