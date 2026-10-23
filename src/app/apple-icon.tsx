import { ImageResponse } from 'next/og'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          borderRadius: 36,
          backgroundColor: '#ffffff',
        }}
      >
        <img
          src={logoBase64}
          width={825}
          height={180}
          alt="Special Sauce Apple Icon"
          style={{
            marginLeft: -6,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
