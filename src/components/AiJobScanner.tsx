'use client'

import { useState } from 'react'
import { parseJobAutoFill } from '@/app/dashboard/actions'

export default function AiJobScanner({ onDataExtracted }: { onDataExtracted: (data: any) => void }) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setError(null)

    const formData = new FormData()
    formData.append('job_description', file)

    const result = await parseJobAutoFill(formData)

    if (result?.error) {
      setError(result.error)
    } else if (result?.data) {
      onDataExtracted(result.data)
    }

    setIsScanning(false)
    e.target.value = '' // Reset input
  }

  return (
    <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-indigo-100 opacity-50 pointer-events-none">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zM18 19H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1zm0-4H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1s-.45 1-1 1z"/></svg>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <h3 className="text-base font-bold text-indigo-900">Have a PDF Job Description?</h3>
          <p className="text-sm text-indigo-700 mt-1">Upload it here and our AI will automatically extract the requirements, title, and details into the form below.</p>
          {error && <p className="text-sm text-red-500 font-bold mt-2">{error}</p>}
        </div>
        
        <div className="shrink-0 w-full md:w-auto">
          <label className={`cursor-pointer inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white ${isScanning ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} transition-colors`}>
            {isScanning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Extracting Data...
              </>
            ) : (
              'Upload PDF'
            )}
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf"
              onChange={handleUpload}
              disabled={isScanning}
            />
          </label>
        </div>
      </div>
    </div>
  )
}