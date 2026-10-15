'use client'

import { useState } from 'react'

export default function VerifyButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleVerification = async () => {
    try {
      setIsLoading(true)
      
      // Call the API route we just built
      const response = await fetch('/api/identity/create-session', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate verification session')
      }
      
      // Redirect the user to the Stripe-hosted verification page
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Verification error:', error)
      alert('Unable to start verification. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleVerification}
      disabled={isLoading}
      className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isLoading 
          ? 'bg-indigo-400 cursor-not-allowed' 
          : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600'
      }`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Stripe...
        </>
      ) : (
        'Verify Identity with Stripe'
      )}
    </button>
  )
}