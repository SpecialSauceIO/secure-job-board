'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadEmployerOrganizationLogo } from '@/app/dashboard/actions'

export default function EmployerBrandLogoUploader({
  companyName,
  initialLogoUrl,
  hasOrg,
}: {
  companyName: string
  initialLogoUrl?: string | null
  hasOrg: boolean
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl || '')
  const [isUploading, setIsUploading] = useState(false)

  const initials = (companyName || 'Company')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.set('logo_file', file)

    const res = await uploadEmployerOrganizationLogo(formData)
    setIsUploading(false)

    if (res?.logoUrl) {
      setLogoUrl(res.logoUrl)
      router.refresh()
    } else if (res?.error) {
      alert(res.error)
    }
  }

  return (
    <div className="relative group shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        disabled={!hasOrg || isUploading}
        onClick={() => hasOrg && fileInputRef.current?.click()}
        title={
          hasOrg
            ? 'Click to upload or update your company white-label logo'
            : 'Set up your company first to upload a logo'
        }
        className="w-16 h-16 rounded-2xl border-2 border-slate-300 bg-white shadow-xs hover:border-indigo-400 transition-all flex items-center justify-center overflow-hidden relative cursor-pointer"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-700">
            <span className="text-lg font-black tracking-tight leading-none">
              {initials || '🏢'}
            </span>
            {hasOrg && (
              <span className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-tighter mt-1">
                + Logo
              </span>
            )}
          </div>
        )}

        {hasOrg && (
          <div className="absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
            <span className="text-[10px] font-extrabold text-white leading-tight">
              {isUploading ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
            </span>
          </div>
        )}
      </button>
    </div>
  )
}
