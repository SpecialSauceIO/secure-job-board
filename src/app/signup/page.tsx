import Link from 'next/link'

export default function SignupSelectionPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      
      <div className="mb-8 flex justify-center">
        <Link href="/" className="group block">
          <img 
            src="/logo.png" 
            alt="Special Sauce Logo" 
            className="h-20 w-auto group-hover:scale-105 transition-transform" 
          />
        </Link>
      </div>

      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border-2 border-2-slate-200 overflow-hidden border-slate-300">
        {/* Header */}
        <div className="p-10 text-center bg-slate-900 text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Join the Platform</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Select your account type to get started.</p>
        </div>
        
        {/* Selection Options */}
        <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Candidate Button */}
          <Link 
            href="/signup/candidate"
            className="group relative p-8 border-2 border-slate-300 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left shadow-sm hover:shadow-md block"
          >
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">I'm a Candidate</h3>
            <p className="text-slate-500 leading-relaxed">Create a secure, anonymous profile and let top employers pitch roles to you directly.</p>
            <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              Continue as Candidate <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>
          
          {/* Employer Button */}
          <Link 
            href="/signup/employer"
            className="group relative p-8 border-2 border-slate-300 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left shadow-sm hover:shadow-md block"
          >
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">I'm an Employer</h3>
            <p className="text-slate-500 leading-relaxed">Search the anonymous talent pool and build your pipeline. Corporate email required.</p>
            <div className="mt-6 flex items-center text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              Continue as Employer <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>

        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/login" className="text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors">
          Already have an account? Sign In
        </Link>
      </div>

    </div>
  )
}