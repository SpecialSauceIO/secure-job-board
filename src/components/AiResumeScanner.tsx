'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { parseResumeAutoFill } from '@/app/dashboard/actions';

// 1. The Matrix-style text scrambling effect
function ScrambleText({ text, isScanning, label }: { text: string, isScanning: boolean, label: string }) {
  const [display, setDisplay] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

  useEffect(() => {
    if (!isScanning) {
      setDisplay(text);
      return;
    }
    const interval = setInterval(() => {
      const length = text ? text.length : 40;
      let randomStr = '';
      for (let i = 0; i < Math.min(length, 100); i++) {
        randomStr += chars[Math.floor(Math.random() * chars.length)];
      }
      setDisplay(randomStr + (length > 100 ? '...' : ''));
    }, 50); // Updates every 50ms for that rapid-fire look
    return () => clearInterval(interval);
  }, [isScanning, text]);

  return (
    <div className="mb-5">
      <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className={`p-4 rounded-lg border font-mono text-sm min-h-[3rem] transition-colors duration-300 break-all overflow-hidden ${
        isScanning 
          ? 'bg-indigo-950 border-indigo-500/50 text-indigo-400 shadow-[inset_0_0_20px_rgba(79,70,229,0.2)]' 
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        {display || <span className="text-slate-400">Awaiting document scan...</span>}
      </div>
    </div>
  );
}
// 2. The interactive form wrapper
function ScannerForm({ profile }: { profile: any }) {
  const { pending } = useFormStatus();
  const [fileName, setFileName] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
      
      {/* CSS for the Laser Scanner */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}} />

      {/* Left Side: Upload & Laser Animation */}
      <div className="p-8 md:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col items-center justify-center">
        <div className="relative w-32 h-40 bg-white border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-6 overflow-hidden shadow-sm">
           {pending && (
             <>
               <div className="absolute left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_12px_3px_rgba(99,102,241,0.8)] z-10 animate-scan"></div>
               <div className="absolute inset-0 bg-indigo-500/10 animate-pulse"></div>
             </>
           )}
           <svg className={`w-12 h-12 transition-colors ${pending ? 'text-indigo-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
           </svg>
        </div>

        <label className="cursor-pointer w-full text-center group">
          <span className="block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 group-hover:border-indigo-400 group-hover:text-indigo-600 transition-colors truncate">
            {fileName || "Select PDF Resume"}
          </span>
          <input
            type="file"
            name="resume"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
          />
        </label>

        <button
          type="submit"
          disabled={pending || !fileName}
          className="mt-4 w-full px-4 py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
        >
          {pending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Scanning...
            </>
          ) : 'Extract Data'}
        </button>
      </div>

      {/* Right Side: Data Visualization */}
      <div className="p-8 md:w-2/3 bg-white">
         <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
           <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-md">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
           </span>
           AI Extraction Status
         </h3>
         
         <ScrambleText label="Years of Experience" isScanning={pending} text={profile?.experience_years || ''} />
         <ScrambleText label="Top Skills Extracted" isScanning={pending} text={profile?.skills || ''} />
         <ScrambleText label="Professional Bio" isScanning={pending} text={profile?.bio || ''} />
      </div>
    </div>
  );
}

// 3. Export the Server Action wrapper
export default function AiResumeScanner({ profile }: { profile: any }) {
  return (
    <form action={parseResumeAutoFill}>
      <ScannerForm profile={profile} />
    </form>
  );
}