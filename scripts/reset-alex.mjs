import fs from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m && !process.env[m[1].trim()]) {
    process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
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

// 1. Delete all applications for Alex
await supabase.from("applications").delete().eq("candidate_id", alexUser.id);

// 2. Wipe Alex's server-side AI Match Cache in Supabase Storage ('resumes' bucket)
const { data: buckets } = await supabase.storage.listBuckets();
for (const b of buckets || []) {
  for (const prefix of ["match-cache-v4", "match-cache-v3", "match-cache-v2", "match-cache"]) {
    await supabase.storage.from(b.name).remove([`${prefix}/${alexUser.id}.json`]);
  }
}

// 3. Ensure Principal DevSecOps & Platform Engineer also has structured_requirements so it never shows "General role competencies"
const { data: devSecJob } = await supabase
  .from("jobs")
  .select("id, structured_requirements")
  .ilike("title", "%Principal DevSecOps%")
  .maybeSingle();

if (devSecJob) {
  const existingMeta = Array.isArray(devSecJob.structured_requirements)
    ? devSecJob.structured_requirements.filter((r) => r && r._ss_job_meta === true)
    : [];
  await supabase
    .from("jobs")
    .update({
      structured_requirements: [
        ...existingMeta,
        { skill: "Kubernetes", level: "Expert", years: 6 },
        { skill: "AWS", level: "Expert", years: 6 },
        { skill: "Terraform", level: "Advanced", years: 5 },
        { skill: "Docker", level: "Advanced", years: 5 },
        { skill: "CI/CD", level: "Advanced", years: 5 },
      ],
    })
    .eq("id", devSecJob.id);
}

console.log("✓ Alex Mercer reset (Name: Alex Mercer, Step 1 at top, ★ Prestige active, Applications & AI Match History wiped)!");
process.exit(0);
