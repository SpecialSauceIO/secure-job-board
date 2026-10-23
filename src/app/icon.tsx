import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'

export default function Icon() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          borderRadius: 14,
          backgroundColor: '#ffffff',
        }}
      >
        <img
          src={logoBase64}
          width={293}
          height={64}
          alt="Special Sauce Icon"
          style={{
            marginLeft: -2,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
