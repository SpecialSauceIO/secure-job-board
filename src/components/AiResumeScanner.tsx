'use client';

import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { parseResumeAutoFill } from '@/app/dashboard/actions';

const EXTRACTION_STEPS = [
  {
    title: 'Securing PDF in Private Resume Vault',
    detail: 'Keeping your name and contact details hidden from public search',
  },
  {
    title: 'Extracting Skills & Experience',
    detail: 'Organizing your core skills, years of experience, and industry',
  },
  {
    title: 'Adding Certifications & Languages',
    detail: 'Formatting your active licenses, education, and language fluency',
  },
  {
    title: 'Preparing TrueFit Score™ Profile',
    detail: 'Finalizing your private profile for instant role matching',
  },
];

const RESUME_SCROLL_KEY = 'ss_scroll_top_after_resume';

function isCertificationLikeLabel(label: string, certSet: Set<string>): boolean {
  const norm = label.trim().toLowerCase();
  if (!norm) return true;
  if (certSet.has(norm)) return true;
  for (const c of certSet) {
    if (c.length >= 5 && (norm.includes(c) || c.includes(norm))) return true;
  }
  return /^(certified\b|comptia\b|pmp\b|cissp\b|itil\b|scrum\s*master\b|aws\s+certified|microsoft\s+certified|google\s+cloud\s+certified|career\s+essentials\s+in\b|.*\baccessibility\s+in\s+action\b|six\s+sigma\b)/i.test(label.trim());
}

function sanitizeDisplayBio(rawBio: any, expYears?: any): string {
  const txt = typeof rawBio === "string" ? rawBio.trim() : "";
  if (!txt) return "";
  const rounded = Math.max(0, Math.round(Number(expYears) || 0));
  let cleaned = txt.replace(/(\d+)\.\d+(\+?\s+years)/gi, (_: string, d: string, rest: string) => String(rounded || Math.round(Number(d))) + rest);
  if (/^Accomplished professional bringing\b/i.test(cleaned)) {
    cleaned = cleaned.replace(/^Accomplished professional bringing\s+/i, "Seasoned professional bringing ");
  }
  return cleaned;
}

function formatSkillsList(skills: any, structuredSkills: any): string[] {
  const certSet = new Set<string>();
  if (Array.isArray(structuredSkills)) {
    for (const item of structuredSkills) {
      if (item && typeof item === "object" && item._ss_pref_meta && typeof item.certifications === "string") {
        item.certifications.split(/[,;\n|]+/).map((c: string) => c.trim().toLowerCase()).filter(Boolean).forEach((c: string) => certSet.add(c));
      }
    }
  }
  if (Array.isArray(structuredSkills) && structuredSkills.length > 0) {
    const names = structuredSkills
      .filter((s: any) => s && typeof s === "object" && !s._ss_meta && !s._ss_pref_meta && (s.skill || s.name))
      .map((s: any) => String(s.skill || s.name).trim())
      .filter((n: string) => Boolean(n) && !isCertificationLikeLabel(n, certSet));
    if (names.length > 0) return Array.from(new Set(names));
  }
  if (Array.isArray(skills)) {
    return Array.from(new Set(skills.map((s: any) => String(s).trim()).filter((n: string) => Boolean(n) && !isCertificationLikeLabel(n, certSet))));
  }
  if (typeof skills === "string" && skills.trim()) {
    return Array.from(new Set(skills.split(",").map((s: string) => s.trim()).filter((n: string) => Boolean(n) && !isCertificationLikeLabel(n, certSet))));
  }
  return [];
}

function ScannerForm({ profile, scanError }: { profile: any; scanError: string | null }) {
  const { pending } = useFormStatus();
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const wasPendingRef = useRef(false);
  useEffect(() => {
    if (wasPendingRef.current && !pending) {
      router.refresh();
    }
  }, [pending, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(RESUME_SCROLL_KEY) === '1') {
        sessionStorage.removeItem(RESUME_SCROLL_KEY);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!pending) {
      if (wasPendingRef.current) {
        wasPendingRef.current = false;
        try {
          sessionStorage.removeItem(RESUME_SCROLL_KEY);
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setActiveStep(0);
      setProgress(0);
      return;
    }

    wasPendingRef.current = true;
    try {
      sessionStorage.setItem(RESUME_SCROLL_KEY, '1');
    } catch {
      // ignore
    }

    setProgress(12);
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < EXTRACTION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 94 ? prev + 4 : prev));
    }, 220);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [pending]);

  const skillPills = formatSkillsList(profile?.skills, profile?.structured_skills);
  const hasExistingData = Boolean(profile?.bio || profile?.experience_years || skillPills.length > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* Left Column: Document Dropzone */}
      <div className="p-6 sm:p-8 lg:col-span-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-300 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Private Resume Vault
          </div>

          {scanError && (
            <div className="mt-3 mb-3 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {scanError}
            </div>
          )}
          <h3 className="text-base font-extrabold text-slate-900">
            Upload Resume PDF to Auto-Fill Your Profile
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your PDF resume and contact details stay locked in your private vault until you choose to share them with an employer.
          </p>

          <label
            className={`mt-5 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              pending
                ? 'border-indigo-400 bg-indigo-50/50'
                : fileName
                ? 'border-emerald-500 bg-emerald-50/40'
                : 'border-slate-300 bg-white hover:border-indigo-500 hover:bg-indigo-50/20'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                pending
                  ? 'bg-indigo-600 text-white'
                  : fileName
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <span className="text-sm font-bold text-slate-800 text-center break-all px-2">
              {fileName ? fileName : 'Select PDF Resume or Drag & Drop'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1">
              {fileName ? 'Ready to build your profile' : 'Standard PDF format • Max 10MB'}
            </span>

            <input
              type="file"
              name="resume"
              accept="application/pdf"
              className="hidden"
              disabled={pending}
              onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
            />
          </label>
        </div>

        <div className="mt-5">
          <button
            type="submit"
            disabled={pending || !fileName}
            className="w-full px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-extrabold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer"
          >
            {pending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Building Your Profile...
              </>
            ) : (
              'Build & Populate Profile'
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Extracted Snapshot */}
      <div className="p-6 sm:p-8 lg:col-span-7 bg-[#0f172a] text-white flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  pending
                    ? 'bg-sky-400 animate-ping'
                    : hasExistingData
                    ? 'bg-emerald-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                {pending
                  ? 'Building Your Profile'
                  : hasExistingData
                  ? 'Private Profile Active'
                  : 'Waiting for Resume Upload'}
              </span>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
              {pending ? `${progress}% Complete` : hasExistingData ? '✓ Ready for Matching' : 'Privacy Protected'}
            </span>
          </div>

          {/* Progress Bar when scanning */}
          {pending && (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 space-y-3">
                {EXTRACTION_STEPS.map((step, index) => {
                  const isDone = index < activeStep;
                  const isCurrent = index === activeStep;
                  return (
                    <div
                      key={step.title}
                      className={`p-3.5 rounded-xl border transition-all duration-300 flex items-start gap-3 ${
                        isCurrent
                          ? 'bg-slate-900/95 border-sky-500/50 shadow-sm'
                          : isDone
                          ? 'bg-slate-900/50 border-emerald-500/30 opacity-90'
                          : 'bg-slate-900/30 border-slate-800/80 opacity-50'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isCurrent
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 animate-pulse'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : index + 1}
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">{step.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{step.detail}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clean Snapshot when not scanning */}
          {!pending && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Experience
                  </div>
                  <div className="text-base font-extrabold text-white mt-1">
                    {profile?.experience_years
                      ? `${Math.round(Number(profile.experience_years) || 0)} Years Experience`
                      : 'Not Set Yet'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Privacy Status
                  </div>
                  <div className="text-xs font-extrabold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                    <span>🔒</span> Name, Email &amp; PDF Hidden Until You Share
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Top Skills
                </div>
                {skillPills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skillPills.slice(0, 16).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                    {skillPills.length > 16 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        +{skillPills.length - 16} more skills in editor
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload your PDF resume on the left to automatically populate your skills.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Anonymous Profile Summary
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {sanitizeDisplayBio(profile?.bio, profile?.experience_years) ||
                    'Your professional summary will appear here after uploading your resume—with your personal contact info removed.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>✓ Private Resume Vault</span>
          <span>TrueFit Score™ Ready</span>
        </div>
      </div>
    </div>
  );
}

export default function AiResumeScanner({ profile }: { profile: any }) {
  const router = useRouter();
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleFormAction(formData: FormData) {
    setScanError(null);
    try {
      const res: any = await parseResumeAutoFill(formData);
      if (res && res.ok === false) {
        setScanError(res.error || "Resume scan could not complete. Please try again.");
        return;
      }
      router.refresh();
    } catch (err: any) {
      setScanError(err?.message || "Unexpected error while scanning your resume.");
    }
  }

  return (
    <form action={handleFormAction}>
      <ScannerForm profile={profile} scanError={scanError} />
    </form>
  );
}
