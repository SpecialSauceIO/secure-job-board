import fs from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^[\x27"]|[\x27"]$/g, "");
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: usersList } = await supabase.auth.admin.listUsers({ perPage: 200 });
const alexUser = (usersList?.users || []).find(
  (u) => (u.email || "").toLowerCase() === "alex.mercer.demo@specialsauce.io"
);

if (!alexUser) {
  console.error("Could not find alex.mercer.demo@specialsauce.io");
  process.exit(1);
}

const emptyWithPrestigeMeta = [
  {
    _ss_meta: true,
    plan: "prestige",
    trialStart: new Date().toISOString(),
    trialBaselineApps: 0,
  },
  {
    _ss_pref_meta: true,
    industry_vertical: "Technology, Software & SaaS",
    education_level: "Practical Experience & Industry Certifications",
    certifications: "",
    availability_window: "Immediately Available",
    employment_types: ["Full-Time (W-2)", "Contract (1099 / Corp-to-Corp)"],
    languages: [{ language: "English", modality: "Both (Written & Verbal)", proficiency: "Fluent / Native" }],
  },
];

// 1. Reset Candidate (Alex Mercer)
await supabase
  .from("profiles")
  .update({
    full_name: "Alex Mercer",
    bio: "",
    skills: "",
    experience_years: null,
    resume_url: null,
    structured_skills: emptyWithPrestigeMeta,
    identity_verified: true,
    is_verified: true,
    is_discoverable: true,
  })
  .eq("id", alexUser.id);

// 2. Delete all applications & pitches for Alex and Apex Cloud Systems jobs
await supabase.from("applications").delete().eq("candidate_id", alexUser.id);

const { data: orgRow } = await supabase
  .from("organizations")
  .select("id")
  .ilike("name", "%Apex Cloud Systems%")
  .maybeSingle();

if (orgRow?.id) {
  const { data: orgJobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("organization_id", orgRow.id);
  const jobIds = (orgJobs || []).map((j) => j.id);
  if (jobIds.length > 0) {
    await supabase.from("applications").delete().in("job_id", jobIds);
  }
}

// 3. Wipe ALL server-side AI Match Cache files (Candidate & Employer) in Supabase Storage
const prefixes = ["_isolated_match_cache_v3", "_ss_match_cache_v4", "match-cache-v4", "match-cache-v3", "match-cache-v2", "match-cache"];
for (const prefix of prefixes) {
  const { data: files } = await supabase.storage.from("resumes").list(prefix, { limit: 200 });
  if (files && files.length > 0) {
    const paths = files.map((f) => `${prefix}/${f.name}`);
    await supabase.storage.from("resumes").remove(paths);
  }
}

console.log("Reset complete: Alex Mercer & Apex Cloud Systems pipelines and AI match caches wiped.");
process.exit(0);