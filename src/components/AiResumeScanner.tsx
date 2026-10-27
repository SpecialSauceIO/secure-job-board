'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { parseResumeAutoFill } from '@/app/dashboard/actions';

const EXTRACTION_STEPS = [
  {
    title: 'Securing PDF in Stage 2 Privacy Vault',
    detail: 'Isolating raw document and redacting personal contact info from Stage 1 public index',
  },
  {
    title: 'Extracting Core Skill Matrix & Role Tenure',
    detail: 'Mapping technical competencies, years of experience, and primary industry vertical',
  },
  {
    title: 'Indexing Credentials, Licenses & Languages',
    detail: 'Standardizing active certifications, academic background, and written/verbal fluency',
  },
  {
    title: 'Calibrating 5-Point AI Fit Radar™ Profile',
    detail: 'Finalizing anonymous Stage 1 candidate profile for instant >=40% role matching',
  },
];

function formatSkillsList(skills: any, structuredSkills: any): string[] {
  if (Array.isArray(structuredSkills) && structuredSkills.length > 0) {
    const names = structuredSkills
      .filter((s: any) => s && typeof s === 'object' && !s._ss_meta && !s._ss_pref_meta && (s.skill || s.name))
      .map((s: any) => String(s.skill || s.name).trim())
      .filter(Boolean);
    if (names.length > 0) return names.slice(0, 10);
  }
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 10);
  }
  if (typeof skills === 'string' && skills.trim()) {
    return skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  return [];
}

function ScannerForm({ profile }: { profile: any }) {
  const { pending } = useFormStatus();
  const [fileName, setFileName] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!pending) {
      setActiveStep(0);
      setProgress(0);
      return;
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
      {/* Left Column: Document Dropzone & Stage 2 Vault Guarantee */}
      <div className="p-6 sm:p-8 lg:col-span-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-300 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Stage 2 Privacy Vault Protected
          </div>

          <h3 className="text-base font-extrabold text-slate-900">
            Upload Resume PDF for Structured AI Parsing
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your raw PDF resume and personal contact details are locked inside your Stage 2 Privacy Vault and never exposed on public feeds.
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
              {fileName ? 'Ready for structured profile extraction' : 'Standard PDF format • Max 10MB'}
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
                Calibrating Anonymous Profile...
              </>
            ) : (
              'Extract & Populate Profile'
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Enterprise Calibration Pipeline & Extracted Snapshot */}
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
                  ? '5-Point AI Fit Radar™ Calibration in Progress'
                  : hasExistingData
                  ? 'Anonymous Stage 1 Profile Calibrated'
                  : 'Awaiting Resume Upload'}
              </span>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
              {pending ? `${progress}% Processed` : hasExistingData ? '✓ Ready for Matching' : 'Stage 1 Redaction Active'}
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

          {/* Clean Structured Snapshot when not actively scanning */}
          {!pending && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calculated Role Tenure
                  </div>
                  <div className="text-base font-extrabold text-white mt-1">
                    {profile?.experience_years
                      ? `${profile.experience_years} Years Experience`
                      : 'Pending Extraction'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Identity Vault Status
                  </div>
                  <div className="text-xs font-extrabold text-emerald-400 mt-1.5 flex items-center gap-1.5">
                    <span>🔒</span> Name, Email &amp; PDF Locked in Stage 2
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Extracted Core Technical &amp; Functional Competencies
                </div>
                {skillPills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skillPills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Upload your PDF resume on the left to automatically populate your structured skill matrix.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Anonymized Executive Summary (Stage 1 Preview)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {profile?.bio ||
                    'Your third-person professional summary will appear here immediately after parsing—redacted of personal contact information.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>✓ Zero Public Resume Harvesting</span>
          <span>5-Point AI Fit Radar™ Ready</span>
        </div>
      </div>
    </div>
  );
}

export default function AiResumeScanner({ profile }: { profile: any }) {
  return (
    <form action={parseResumeAutoFill}>
      <ScannerForm profile={profile} />
    </form>
  );
}
