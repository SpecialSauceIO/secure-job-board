import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const alt = 'Special Sauce | 100% Human-to-Human, Identity-Protected Hiring Marketplace'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.22), transparent 45%), radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.18), transparent 45%)',
          padding: '56px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Trust Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 24px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            color: '#93c5fd',
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <span>Identity-Protected</span>
          <span style={{ color: '#f97316' }}>•</span>
          <span>Stripe ID-Verified</span>
          <span style={{ color: '#f97316' }}>•</span>
          <span>Zero Resume Black Holes</span>
        </div>

        {/* Center Brand Card with Oct 23 Horizontal Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              padding: '28px 52px',
              borderRadius: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <img
              src={logoBase64}
              width={688}
              height={150}
              alt="specialsauce.io logo"
              style={{ objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
              }}
            >
              Hire for Verified Talent, Not Background.
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
                maxWidth: '920px',
              }}
            >
              The Introduction (Anonymous Chat) • The Conversation (Professional-Controlled Vault Release)
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.2)',
            paddingTop: '22px',
            color: '#cbd5e1',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          <span style={{ color: '#38bdf8' }}>www.specialsauce.io</span>
          <span style={{ color: '#f97316' }}>Securely Connecting Professionals & Employers</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
