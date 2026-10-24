'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID || ''
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
const X_PIXEL_ID = process.env.NEXT_PUBLIC_X_PIXEL_ID || ''

/**
 * Helper to fire conversion events across any active ad pixels
 * (Meta/Facebook, Google Analytics/YouTube, LinkedIn, X/Twitter)
 */
export function trackAdConversion(
  eventType: 'CompleteRegistration' | 'Lead' | 'Purchase',
  params?: { value?: number; currency?: string; plan?: string; role?: string }
) {
  if (typeof window === 'undefined') return
  const w = window as any
  const value = params?.value ?? 0
  const currency = params?.currency || 'USD'

  try {
    // 1. Meta (Facebook / Instagram) Pixel
    if (typeof w.fbq === 'function') {
      w.fbq('track', eventType, {
        value,
        currency,
        content_name: params?.plan || eventType,
        content_category: params?.role || 'general',
      })
    }

    // 2. Google Analytics 4 / YouTube Ads
    if (typeof w.gtag === 'function') {
      const gaEvent =
        eventType === 'Purchase'
          ? 'purchase'
          : eventType === 'CompleteRegistration'
          ? 'sign_up'
          : 'generate_lead'
      w.gtag('event', gaEvent, {
        value,
        currency,
        items: params?.plan ? [{ item_name: params.plan }] : undefined,
      })
    }

    // 3. X (Twitter) Pixel
    if (typeof w.twq === 'function') {
      w.twq('event', eventType, {
        value,
        currency,
        contents: params?.plan ? [{ content_name: params.plan }] : undefined,
      })
    }

    // 4. LinkedIn Insight Tag (fires page-level or custom conversion ID if configured)
    if (typeof w.lintrk === 'function' && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) {
      w.lintrk('track', {
        conversion_id: Number(process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID),
      })
    }
  } catch (err) {
    // Never let an ad blocker or pixel script error break the app UI
    console.warn('[Ad Pixel Warning]:', err)
  }
}

export default function MarketingPixels() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Capture UTM parameters into sessionStorage so you know which ad drove a signup
  useEffect(() => {
    if (typeof window === 'undefined' || !searchParams) return
    const w = window as any

    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')
    if (utmSource || utmMedium || utmCampaign) {
      try {
        sessionStorage.setItem(
          'ss_last_utm',
          JSON.stringify({
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign,
            landed_at: new Date().toISOString(),
            landing_path: pathname,
          })
        )
      } catch {}
    }

    // Fire pageview on route transitions
    if (typeof w.fbq === 'function') w.fbq('track', 'PageView')
    if (typeof w.gtag === 'function' && GA_MEASUREMENT_ID) {
      w.gtag('config', GA_MEASUREMENT_ID, { page_path: pathname })
    }
  }, [pathname, searchParams])

  return (
    <>
      {/* 1. Meta (Facebook / Instagram) Pixel */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* 2. Google Analytics 4 / Google & YouTube Ads Tag */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      {/* 3. LinkedIn Insight Tag */}
      {LINKEDIN_PARTNER_ID && (
        <Script id="linkedin-insight" strategy="afterInteractive">
          {`
            _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
            (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </Script>
      )}

      {/* 4. X (Twitter) Universal Website Tag */}
      {X_PIXEL_ID && (
        <Script id="x-pixel" strategy="afterInteractive">
          {`
            !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
            },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
            a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
            twq('config','${X_PIXEL_ID}');
          `}
        </Script>
      )}
    </>
  )
}
