import crypto from "crypto"
import { getOpsServiceClient } from "@/lib/ops-bridge"

const SHIELD_BUCKET = "resumes"
const SHIELD_VAULT_DIR = "_isolated_inbound_shield"
const SHIELD_VAULT_PREFIX = "airlock_links_v1_"
const SHIELD_VAULT_PATH = "_isolated_inbound_shield/airlock_links_v1.json"
const MAX_ACTIVE_LINKS_PER_USER = 25

export type ShieldLinkStatus = "active" | "redeemed" | "revoked" | "expired"

export interface StoredShieldRecord {
  id: string
  token_sha256: string
  owner_hash: string
  encrypted_payload: string
  created_at: string
  expires_at: string
  status: "active" | "redeemed" | "revoked"
  redeemed_at?: string | null
  revoked_at?: string | null
  application_id?: string | null
  last_below_threshold_score?: number | null
  below_threshold_attempts?: number
  last_checked_at?: string | null
}

interface DecryptedShieldPayload {
  candidate_id: string
  private_memo: string
}

interface ShieldVaultFile {
  version: 1
  updated_at: string
  records: StoredShieldRecord[]
}

export interface ProfessionalShieldLinkView {
  id: string
  private_memo: string
  created_at: string
  expires_at: string
  status: ShieldLinkStatus
  redeemed_at?: string | null
  revoked_at?: string | null
  application_id?: string | null
}

function cleanSecret(val?: string | null): string {
  if (!val) return ""
  return val.trim().replace(/^["']+|["']+$/g, "").trim()
}

function getShieldKey(): Buffer {
  const raw =
    cleanSecret(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    cleanSecret(process.env.STRIPE_SECRET_KEY) ||
    "specialsauce-inbound-shield-fallback-key-2026"
  return crypto.createHash("sha256").update("ss_inbound_shield_v1:" + raw).digest()
}

function hashToken(rawToken: string): string {
  return crypto
    .createHash("sha256")
    .update("ss_airlock_token_v1:" + rawToken.trim())
    .digest("hex")
}

function hashOwnerId(candidateId: string): string {
  return crypto
    .createHmac("sha256", getShieldKey())
    .update("ss_airlock_owner_v1:" + candidateId.trim())
    .digest("hex")
}

function encryptPayload(payload: DecryptedShieldPayload): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getShieldKey(), iv)
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

function decryptPayload(blob: string): DecryptedShieldPayload | null {
  try {
    const buf = Buffer.from(blob, "base64url")
    if (buf.length < 29) return null
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", getShieldKey(), iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
    const parsed = JSON.parse(dec)
    if (!parsed || typeof parsed.candidate_id !== "string") return null
    return {
      candidate_id: parsed.candidate_id,
      private_memo: typeof parsed.private_memo === "string" ? parsed.private_memo : "",
    }
  } catch {
    return null
  }
}

function shieldStatusRank(s: StoredShieldRecord["status"]): number {
  if (s === "redeemed") return 3
  if (s === "revoked") return 2
  return 1
}

function mergeShieldRecordLists(lists: StoredShieldRecord[][]): StoredShieldRecord[] {
  const byId = new Map<string, StoredShieldRecord>()
  for (const list of lists) {
    for (const item of list) {
      if (!item || !item.id) continue
      const existing = byId.get(item.id)
      if (!existing) {
        byId.set(item.id, item)
      } else {
        const existingAttempts = Number(existing.below_threshold_attempts || 0)
        const itemAttempts = Number(item.below_threshold_attempts || 0)
        const mergedAttempts = Math.max(existingAttempts, itemAttempts)
        const itemCheckedStr = item.last_checked_at || ""
        const existingCheckedStr = existing.last_checked_at || ""
        const itemCheckedNewer =
          Boolean(itemCheckedStr) &&
          (!existingCheckedStr ||
            new Date(itemCheckedStr).getTime() >= new Date(existingCheckedStr).getTime())
        const mergedScore = itemCheckedNewer
          ? (item.last_below_threshold_score ?? existing.last_below_threshold_score ?? null)
          : (existing.last_below_threshold_score ?? item.last_below_threshold_score ?? null)
        const mergedCheckedAt = itemCheckedNewer
          ? (itemCheckedStr || existingCheckedStr || null)
          : (existingCheckedStr || itemCheckedStr || null)
        if (shieldStatusRank(item.status) >= shieldStatusRank(existing.status)) {
          byId.set(item.id, {
            ...existing,
            ...item,
            redeemed_at: item.redeemed_at || existing.redeemed_at || null,
            revoked_at: item.revoked_at || existing.revoked_at || null,
            application_id: item.application_id || existing.application_id || null,
            below_threshold_attempts: mergedAttempts,
            last_below_threshold_score: mergedScore,
            last_checked_at: mergedCheckedAt,
          })
        } else {
          byId.set(item.id, {
            ...existing,
            below_threshold_attempts: mergedAttempts,
            last_below_threshold_score: mergedScore,
            last_checked_at: mergedCheckedAt,
          })
        }
      }
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

const SHIELD_VAULT_CACHE_TTL_MS = 12_000
let shieldVaultCache: { data: ShieldVaultFile; expiresAt: number } | null = null
let shieldVaultInFlight: Promise<ShieldVaultFile> | null = null
let employerShieldVaultCache: { data: ShieldVaultFile; expiresAt: number } | null = null
let employerShieldVaultInFlight: Promise<ShieldVaultFile> | null = null

async function loadShieldVault(forceFresh = false): Promise<ShieldVaultFile> {
  if (!forceFresh && shieldVaultCache && Date.now() < shieldVaultCache.expiresAt) {
    return shieldVaultCache.data
  }
  if (!forceFresh && shieldVaultInFlight) {
    return shieldVaultInFlight
  }
  const run = loadShieldVaultUncached()
  shieldVaultInFlight = run
  try {
    const data = await run
    shieldVaultCache = { data, expiresAt: Date.now() + SHIELD_VAULT_CACHE_TTL_MS }
    return data
  } finally {
    if (shieldVaultInFlight === run) shieldVaultInFlight = null
  }
}

async function loadShieldVaultUncached(): Promise<ShieldVaultFile> {
  const client = getOpsServiceClient()
  const empty: ShieldVaultFile = {
    version: 1,
    updated_at: new Date().toISOString(),
    records: [],
  }
  if (!client) return empty
  try {
    const { data: fileList } = await client.storage
      .from(SHIELD_BUCKET)
      .list(SHIELD_VAULT_DIR, {
        limit: 25,
        sortBy: { column: "name", order: "desc" },
      })

    const versionedPaths = (fileList || [])
      .filter((f) => f.name.startsWith(SHIELD_VAULT_PREFIX) && f.name.endsWith(".json"))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 4)
      .map((f) => `${SHIELD_VAULT_DIR}/${f.name}`)

    const pathsToRead = versionedPaths.length > 0
      ? [...versionedPaths.reverse()]
      : [SHIELD_VAULT_PATH]

    const downloads = await Promise.all(
      pathsToRead.map((p) => client.storage.from(SHIELD_BUCKET).download(p))
    )

    const recordBatches: StoredShieldRecord[][] = []
    let latestUpdatedAt = empty.updated_at
    for (const res of downloads) {
      if (res?.data && !res.error) {
        try {
          const parsed = JSON.parse(await res.data.text())
          if (Array.isArray(parsed?.records)) {
            recordBatches.push(parsed.records)
          }
          if (typeof parsed?.updated_at === "string" && parsed.updated_at > latestUpdatedAt) {
            latestUpdatedAt = parsed.updated_at
          }
        } catch {}
      }
    }

    return {
      version: 1,
      updated_at: latestUpdatedAt,
      records: mergeShieldRecordLists(recordBatches),
    }
  } catch {
    return empty
  }
}

async function saveShieldVault(vault: ShieldVaultFile): Promise<boolean> {
  const client = getOpsServiceClient()
  if (!client) return false
  const latest = await loadShieldVault(true)
  const mergedRecords = mergeShieldRecordLists([latest.records, vault.records])
  const nowIso = new Date().toISOString()
  const payload: ShieldVaultFile = {
    version: 1,
    updated_at: nowIso,
    records: mergedRecords,
  }
  const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8")
  const snapshotPath = `${SHIELD_VAULT_DIR}/${SHIELD_VAULT_PREFIX}${Date.now()}_${crypto.randomBytes(3).toString("hex")}.json`

  const [snapRes, baseRes] = await Promise.all([
    client.storage.from(SHIELD_BUCKET).upload(snapshotPath, body, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    }),
    client.storage.from(SHIELD_BUCKET).upload(SHIELD_VAULT_PATH, body, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    }),
  ])
  if (!snapRes.error || !baseRes.error) {
    shieldVaultCache = { data: payload, expiresAt: Date.now() + SHIELD_VAULT_CACHE_TTL_MS }
  }

  try {
    const { data: list } = await client.storage
      .from(SHIELD_BUCKET)
      .list(SHIELD_VAULT_DIR, { limit: 100, sortBy: { column: "name", order: "desc" } })
    const stalePaths = (list || [])
      .filter((f) => f.name.startsWith(SHIELD_VAULT_PREFIX) && f.name.endsWith(".json"))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(15)
      .map((f) => `${SHIELD_VAULT_DIR}/${f.name}`)
    if (stalePaths.length > 0) {
      await client.storage.from(SHIELD_BUCKET).remove(stalePaths)
    }
  } catch {}

  return !snapRes.error || !baseRes.error
}

function computeEffectiveStatus(rec: StoredShieldRecord, nowMs: number): ShieldLinkStatus {
  if (rec.status === "redeemed") return "redeemed"
  if (rec.status === "revoked") return "revoked"
  const expMs = new Date(rec.expires_at).getTime()
  if (Number.isNaN(expMs) || expMs <= nowMs) return "expired"
  return "active"
}

export function isWellFormedShieldToken(rawToken: string): boolean {
  const clean = String(rawToken || "").trim()
  return /^ss_air_[A-Za-z0-9_-]{24,64}$/.test(clean)
}

export async function listShieldLinksForProfessional(
  candidateId: string
): Promise<ProfessionalShieldLinkView[]> {
  const vault = await loadShieldVault()
  const ownerHash = hashOwnerId(candidateId)
  const nowMs = Date.now()
  const out: ProfessionalShieldLinkView[] = []

  for (const rec of vault.records) {
    if (rec.owner_hash !== ownerHash) continue
    const dec = decryptPayload(rec.encrypted_payload)
    if (!dec || dec.candidate_id !== candidateId) continue
    out.push({
      id: rec.id,
      private_memo: dec.private_memo,
      created_at: rec.created_at,
      expires_at: rec.expires_at,
      status: computeEffectiveStatus(rec, nowMs),
      redeemed_at: rec.redeemed_at || null,
      revoked_at: rec.revoked_at || null,
      application_id: rec.application_id || null,
    })
  }

  return out.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function mintShieldLinkForProfessional(params: {
  candidateId: string
  privateMemo?: string
  ttlDays?: number
}): Promise<{ token?: string; record?: ProfessionalShieldLinkView; error?: string }> {
  const candidateId = String(params.candidateId || "").trim()
  if (!candidateId) return { error: "Authentication required." }

  const cleanMemo = String(params.privateMemo || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 100)

  const ttlDaysRaw = Number(params.ttlDays || 14)
  const ttlDays = ttlDaysRaw === 7 || ttlDaysRaw === 14 || ttlDaysRaw === 30 ? ttlDaysRaw : 14

  const vault = await loadShieldVault()
  const ownerHash = hashOwnerId(candidateId)
  const nowMs = Date.now()

  const activeCount = vault.records.filter(
    (r) => r.owner_hash === ownerHash && computeEffectiveStatus(r, nowMs) === "active"
  ).length

  if (activeCount >= MAX_ACTIVE_LINKS_PER_USER) {
    return {
      error: `You already have ${MAX_ACTIVE_LINKS_PER_USER} active one-time links. Revoke an unused link before creating another.`,
    }
  }

  const rawToken = "ss_air_" + crypto.randomBytes(24).toString("base64url")
  const tokenSha = hashToken(rawToken)
  const createdIso = new Date(nowMs).toISOString()
  const expiresIso = new Date(nowMs + ttlDays * 24 * 60 * 60 * 1000).toISOString()
  const id = "shd_" + crypto.randomBytes(8).toString("hex")

  const newRecord: StoredShieldRecord = {
    id,
    token_sha256: tokenSha,
    owner_hash: ownerHash,
    encrypted_payload: encryptPayload({
      candidate_id: candidateId,
      private_memo: cleanMemo,
    }),
    created_at: createdIso,
    expires_at: expiresIso,
    status: "active",
    redeemed_at: null,
    revoked_at: null,
    application_id: null,
  }

  vault.records.unshift(newRecord)
  const ok = await saveShieldVault(vault)
  if (!ok) {
    return { error: "Unable to save one-time verification link right now. Please try again." }
  }

  return {
    token: rawToken,
    record: {
      id,
      private_memo: cleanMemo,
      created_at: createdIso,
      expires_at: expiresIso,
      status: "active",
      redeemed_at: null,
      revoked_at: null,
      application_id: null,
    },
  }
}

export async function revokeShieldLinkForProfessional(params: {
  candidateId: string
  linkId: string
}): Promise<{ ok: boolean; error?: string }> {
  const vault = await loadShieldVault()
  const ownerHash = hashOwnerId(params.candidateId)
  const idx = vault.records.findIndex(
    (r) => r.id === params.linkId && r.owner_hash === ownerHash
  )
  if (idx === -1) return { ok: false, error: "Link not found." }

  const rec = vault.records[idx]
  const dec = decryptPayload(rec.encrypted_payload)
  if (!dec || dec.candidate_id !== params.candidateId) {
    return { ok: false, error: "Link not found." }
  }
  if (rec.status === "redeemed") {
    return { ok: false, error: "This link was already used for a verified invitation." }
  }

  vault.records[idx] = {
    ...rec,
    status: "revoked",
    revoked_at: new Date().toISOString(),
  }
  const saved = await saveShieldVault(vault)
  if (!saved) return { ok: false, error: "Could not revoke link. Please retry." }
  return { ok: true }
}

export async function inspectPublicAirlockToken(rawToken: string): Promise<{
  active: boolean
}> {
  if (!isWellFormedShieldToken(rawToken)) return { active: false }
  const vault = await loadShieldVault()
  const tokenSha = hashToken(rawToken)
  const nowMs = Date.now()
  const rec = vault.records.find((r) => r.token_sha256 === tokenSha)
  if (!rec) return { active: false }
  return { active: computeEffectiveStatus(rec, nowMs) === "active" }
}

export async function resolveActiveAirlockTarget(rawToken: string): Promise<{
  active: boolean
  linkId?: string
  candidateId?: string
  privateMemo?: string
}> {
  if (!isWellFormedShieldToken(rawToken)) return { active: false }
  const vault = await loadShieldVault()
  const tokenSha = hashToken(rawToken)
  const nowMs = Date.now()
  const rec = vault.records.find((r) => r.token_sha256 === tokenSha)
  if (!rec || computeEffectiveStatus(rec, nowMs) !== "active") {
    return { active: false }
  }
  const dec = decryptPayload(rec.encrypted_payload)
  if (!dec || !dec.candidate_id) return { active: false }
  return {
    active: true,
    linkId: rec.id,
    candidateId: dec.candidate_id,
    privateMemo: dec.private_memo,
  }
}

export async function markAirlockTokenRedeemed(params: {
  rawToken: string
  applicationId: string
}): Promise<boolean> {
  if (!isWellFormedShieldToken(params.rawToken)) return false
  const vault = await loadShieldVault()
  const tokenSha = hashToken(params.rawToken)
  const nowMs = Date.now()
  const idx = vault.records.findIndex((r) => r.token_sha256 === tokenSha)
  if (idx === -1) return false
  if (computeEffectiveStatus(vault.records[idx], nowMs) !== "active") return false

  vault.records[idx] = {
    ...vault.records[idx],
    status: "redeemed",
    redeemed_at: new Date(nowMs).toISOString(),
    application_id: params.applicationId,
  }
  return await saveShieldVault(vault)
}

const EMPLOYER_SHIELD_VAULT_DIR = "_isolated_employer_talent_shield"
const EMPLOYER_SHIELD_VAULT_PREFIX = "talent_shield_links_v1_"
const EMPLOYER_SHIELD_VAULT_PATH = "_isolated_employer_talent_shield/talent_shield_links_v1.json"
const MAX_ACTIVE_EMPLOYER_LINKS_PER_ORG = 50

export type EmployerTalentShieldMode = "outbound_sourcing" | "inbound_dm_gate"

interface DecryptedEmployerShieldPayload {
  organization_id: string
  created_by_user_id: string
  job_id: string
  mode: EmployerTalentShieldMode
  employer_pitch: string
  private_memo: string
}

export interface EmployerTalentShieldLinkView {
  id: string
  job_id: string
  mode: EmployerTalentShieldMode
  employer_pitch: string
  private_memo: string
  created_by_user_id: string
  created_at: string
  expires_at: string
  status: ShieldLinkStatus
  redeemed_at?: string | null
  revoked_at?: string | null
  application_id?: string | null
  last_below_threshold_score?: number | null
  below_threshold_attempts?: number
  last_checked_at?: string | null
}

function hashEmployerOrgId(organizationId: string): string {
  return crypto
    .createHmac("sha256", getShieldKey())
    .update("ss_talent_shield_org_v1:" + organizationId.trim())
    .digest("hex")
}

function hashEmployerToken(rawToken: string): string {
  return crypto
    .createHash("sha256")
    .update("ss_talent_shield_token_v1:" + rawToken.trim())
    .digest("hex")
}

function encryptEmployerPayload(payload: DecryptedEmployerShieldPayload): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getShieldKey(), iv)
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64url")
}

function decryptEmployerPayload(blob: string): DecryptedEmployerShieldPayload | null {
  try {
    const buf = Buffer.from(blob, "base64url")
    if (buf.length < 29) return null
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const data = buf.subarray(28)
    const decipher = crypto.createDecipheriv("aes-256-gcm", getShieldKey(), iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8")
    const parsed = JSON.parse(dec)
    if (!parsed || typeof parsed.organization_id !== "string" || typeof parsed.job_id !== "string") {
      return null
    }
    const mode: EmployerTalentShieldMode =
      parsed.mode === "inbound_dm_gate" ? "inbound_dm_gate" : "outbound_sourcing"
    return {
      organization_id: parsed.organization_id,
      created_by_user_id: typeof parsed.created_by_user_id === "string" ? parsed.created_by_user_id : "",
      job_id: parsed.job_id,
      mode,
      employer_pitch: typeof parsed.employer_pitch === "string" ? parsed.employer_pitch : "",
      private_memo: typeof parsed.private_memo === "string" ? parsed.private_memo : "",
    }
  } catch {
    return null
  }
}

async function loadEmployerShieldVault(forceFresh = false): Promise<ShieldVaultFile> {
  if (!forceFresh && employerShieldVaultCache && Date.now() < employerShieldVaultCache.expiresAt) {
    return employerShieldVaultCache.data
  }
  if (!forceFresh && employerShieldVaultInFlight) {
    return employerShieldVaultInFlight
  }
  const run = loadEmployerShieldVaultUncached()
  employerShieldVaultInFlight = run
  try {
    const data = await run
    employerShieldVaultCache = { data, expiresAt: Date.now() + SHIELD_VAULT_CACHE_TTL_MS }
    return data
  } finally {
    if (employerShieldVaultInFlight === run) employerShieldVaultInFlight = null
  }
}

async function loadEmployerShieldVaultUncached(): Promise<ShieldVaultFile> {
  const client = getOpsServiceClient()
  const empty: ShieldVaultFile = {
    version: 1,
    updated_at: new Date().toISOString(),
    records: [],
  }
  if (!client) return empty
  try {
    const { data: fileList } = await client.storage
      .from(SHIELD_BUCKET)
      .list(EMPLOYER_SHIELD_VAULT_DIR, {
        limit: 25,
        sortBy: { column: "name", order: "desc" },
      })

    const versionedPaths = (fileList || [])
      .filter((f) => f.name.startsWith(EMPLOYER_SHIELD_VAULT_PREFIX) && f.name.endsWith(".json"))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, 4)
      .map((f) => `${EMPLOYER_SHIELD_VAULT_DIR}/${f.name}`)

    const pathsToRead =
      versionedPaths.length > 0 ? [...versionedPaths.reverse()] : [EMPLOYER_SHIELD_VAULT_PATH]

    const downloads = await Promise.all(
      pathsToRead.map((p) => client.storage.from(SHIELD_BUCKET).download(p))
    )

    const recordBatches: StoredShieldRecord[][] = []
    let latestUpdatedAt = empty.updated_at
    for (const res of downloads) {
      if (res?.data && !res.error) {
        try {
          const parsed = JSON.parse(await res.data.text())
          if (Array.isArray(parsed?.records)) {
            recordBatches.push(parsed.records)
          }
          if (typeof parsed?.updated_at === "string" && parsed.updated_at > latestUpdatedAt) {
            latestUpdatedAt = parsed.updated_at
          }
        } catch {}
      }
    }

    return {
      version: 1,
      updated_at: latestUpdatedAt,
      records: mergeShieldRecordLists(recordBatches),
    }
  } catch {
    return empty
  }
}

async function saveEmployerShieldVault(vault: ShieldVaultFile): Promise<boolean> {
  const client = getOpsServiceClient()
  if (!client) return false
  const latest = await loadEmployerShieldVault(true)
  const mergedRecords = mergeShieldRecordLists([latest.records, vault.records])
  const nowIso = new Date().toISOString()
  const payload: ShieldVaultFile = {
    version: 1,
    updated_at: nowIso,
    records: mergedRecords,
  }
  const body = Buffer.from(JSON.stringify(payload, null, 2), "utf8")
  const snapshotPath = `${EMPLOYER_SHIELD_VAULT_DIR}/${EMPLOYER_SHIELD_VAULT_PREFIX}${Date.now()}_${crypto.randomBytes(3).toString("hex")}.json`

  const [snapRes, baseRes] = await Promise.all([
    client.storage.from(SHIELD_BUCKET).upload(snapshotPath, body, {
      contentType: "application/json",
      upsert: true,
    }),
    client.storage.from(SHIELD_BUCKET).upload(EMPLOYER_SHIELD_VAULT_PATH, body, {
      contentType: "application/json",
      upsert: true,
    }),
  ])

  if (!snapRes.error || !baseRes.error) {
    employerShieldVaultCache = { data: payload, expiresAt: Date.now() + SHIELD_VAULT_CACHE_TTL_MS }
  }
  return Boolean(!snapRes.error || !baseRes.error)
}

export function isWellFormedEmployerTalentShieldToken(rawToken: string): boolean {
  const clean = String(rawToken || "").trim()
  return /^ss_inv_[A-Za-z0-9_-]{24,64}$/.test(clean)
}

export async function listEmployerTalentShieldLinks(
  organizationId: string
): Promise<EmployerTalentShieldLinkView[]> {
  const cleanOrgId = String(organizationId || "").trim()
  if (!cleanOrgId) return []
  const vault = await loadEmployerShieldVault()
  const ownerHash = hashEmployerOrgId(cleanOrgId)
  const nowMs = Date.now()
  const out: EmployerTalentShieldLinkView[] = []

  for (const rec of vault.records) {
    if (rec.owner_hash !== ownerHash) continue
    const dec = decryptEmployerPayload(rec.encrypted_payload)
    if (!dec || dec.organization_id !== cleanOrgId) continue
    out.push({
      id: rec.id,
      job_id: dec.job_id,
      mode: dec.mode,
      employer_pitch: dec.employer_pitch,
      private_memo: dec.private_memo,
      created_by_user_id: dec.created_by_user_id,
      created_at: rec.created_at,
      expires_at: rec.expires_at,
      status: computeEffectiveStatus(rec, nowMs),
      redeemed_at: rec.redeemed_at || null,
      revoked_at: rec.revoked_at || null,
      application_id: rec.application_id || null,
      last_below_threshold_score:
        typeof rec.last_below_threshold_score === "number"
          ? rec.last_below_threshold_score
          : null,
      below_threshold_attempts: Number(rec.below_threshold_attempts || 0),
      last_checked_at: rec.last_checked_at || null,
    })
  }

  return out.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function mintEmployerTalentShieldLink(params: {
  organizationId: string
  createdByUserId: string
  jobId: string
  mode: EmployerTalentShieldMode
  employerPitch?: string
  privateMemo?: string
  ttlDays?: number
}): Promise<{ token?: string; record?: EmployerTalentShieldLinkView; error?: string }> {
  const organizationId = String(params.organizationId || "").trim()
  const createdByUserId = String(params.createdByUserId || "").trim()
  const jobId = String(params.jobId || "").trim()
  if (!organizationId || !createdByUserId || !jobId) {
    return { error: "Organization and active Protected Role are required." }
  }

  const mode: EmployerTalentShieldMode =
    params.mode === "inbound_dm_gate" ? "inbound_dm_gate" : "outbound_sourcing"

  const cleanPitch = String(params.employerPitch || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 600)

  const cleanMemo = String(params.privateMemo || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 140)

  const ttlDaysRaw = Number(params.ttlDays || 14)
  const ttlDays = ttlDaysRaw === 7 || ttlDaysRaw === 14 || ttlDaysRaw === 30 ? ttlDaysRaw : 14

  const vault = await loadEmployerShieldVault()
  const ownerHash = hashEmployerOrgId(organizationId)
  const nowMs = Date.now()

  const activeCount = vault.records.filter(
    (r) => r.owner_hash === ownerHash && computeEffectiveStatus(r, nowMs) === "active"
  ).length

  if (activeCount >= MAX_ACTIVE_EMPLOYER_LINKS_PER_ORG) {
    return {
      error: `Your organization already has ${MAX_ACTIVE_EMPLOYER_LINKS_PER_ORG} active Talent Shield links. Retire an unused link before creating another.`,
    }
  }

  const rawToken = "ss_inv_" + crypto.randomBytes(24).toString("base64url")
  const tokenSha = hashEmployerToken(rawToken)
  const createdIso = new Date(nowMs).toISOString()
  const expiresIso = new Date(nowMs + ttlDays * 24 * 60 * 60 * 1000).toISOString()
  const id = "tsh_" + crypto.randomBytes(8).toString("hex")

  const newRecord: StoredShieldRecord = {
    id,
    token_sha256: tokenSha,
    owner_hash: ownerHash,
    encrypted_payload: encryptEmployerPayload({
      organization_id: organizationId,
      created_by_user_id: createdByUserId,
      job_id: jobId,
      mode,
      employer_pitch: cleanPitch,
      private_memo: cleanMemo,
    }),
    created_at: createdIso,
    expires_at: expiresIso,
    status: "active",
    redeemed_at: null,
    revoked_at: null,
    application_id: null,
  }

  vault.records.unshift(newRecord)
  const ok = await saveEmployerShieldVault(vault)
  if (!ok) {
    return { error: "Unable to save one-time Talent Shield link right now. Please try again." }
  }

  return {
    token: rawToken,
    record: {
      id,
      job_id: jobId,
      mode,
      employer_pitch: cleanPitch,
      private_memo: cleanMemo,
      created_by_user_id: createdByUserId,
      created_at: createdIso,
      expires_at: expiresIso,
      status: "active",
      redeemed_at: null,
      revoked_at: null,
      application_id: null,
    },
  }
}

export async function revokeEmployerTalentShieldLink(params: {
  organizationId: string
  linkId: string
}): Promise<{ ok: boolean; error?: string }> {
  const cleanOrgId = String(params.organizationId || "").trim()
  const cleanLinkId = String(params.linkId || "").trim()
  if (!cleanOrgId || !cleanLinkId) return { ok: false, error: "Link not found." }

  const vault = await loadEmployerShieldVault()
  const ownerHash = hashEmployerOrgId(cleanOrgId)
  const idx = vault.records.findIndex(
    (r) => r.id === cleanLinkId && r.owner_hash === ownerHash
  )
  if (idx === -1) return { ok: false, error: "Link not found." }

  const rec = vault.records[idx]
  const dec = decryptEmployerPayload(rec.encrypted_payload)
  if (!dec || dec.organization_id !== cleanOrgId) {
    return { ok: false, error: "Link not found." }
  }
  if (rec.status === "redeemed") {
    return { ok: false, error: "This link was already redeemed by a verified Professional." }
  }

  vault.records[idx] = {
    ...rec,
    status: "revoked",
    revoked_at: new Date().toISOString(),
  }
  const saved = await saveEmployerShieldVault(vault)
  if (!saved) return { ok: false, error: "Could not retire link. Please retry." }
  return { ok: true }
}

export async function inspectPublicEmployerTalentShieldToken(rawToken: string): Promise<{
  active: boolean
  mode?: EmployerTalentShieldMode
}> {
  if (!isWellFormedEmployerTalentShieldToken(rawToken)) return { active: false }
  const vault = await loadEmployerShieldVault()
  const tokenSha = hashEmployerToken(rawToken)
  const nowMs = Date.now()
  const rec = vault.records.find((r) => r.token_sha256 === tokenSha)
  if (!rec || computeEffectiveStatus(rec, nowMs) !== "active") {
    return { active: false }
  }
  const dec = decryptEmployerPayload(rec.encrypted_payload)
  if (!dec) return { active: false }
  return { active: true, mode: dec.mode }
}

export async function resolveActiveEmployerTalentShieldTarget(rawToken: string): Promise<{
  active: boolean
  linkId?: string
  organizationId?: string
  createdByUserId?: string
  jobId?: string
  mode?: EmployerTalentShieldMode
  employerPitch?: string
  privateMemo?: string
}> {
  if (!isWellFormedEmployerTalentShieldToken(rawToken)) return { active: false }
  const vault = await loadEmployerShieldVault()
  const tokenSha = hashEmployerToken(rawToken)
  const nowMs = Date.now()
  const rec = vault.records.find((r) => r.token_sha256 === tokenSha)
  if (!rec || computeEffectiveStatus(rec, nowMs) !== "active") {
    return { active: false }
  }
  const dec = decryptEmployerPayload(rec.encrypted_payload)
  if (!dec || !dec.organization_id || !dec.job_id) return { active: false }
  return {
    active: true,
    linkId: rec.id,
    organizationId: dec.organization_id,
    createdByUserId: dec.created_by_user_id,
    jobId: dec.job_id,
    mode: dec.mode,
    employerPitch: dec.employer_pitch,
    privateMemo: dec.private_memo,
  }
}

export async function markEmployerTalentShieldTokenRedeemed(params: {
  rawToken: string
  applicationId: string
}): Promise<boolean> {
  if (!isWellFormedEmployerTalentShieldToken(params.rawToken)) return false
  const vault = await loadEmployerShieldVault()
  const tokenSha = hashEmployerToken(params.rawToken)
  const nowMs = Date.now()
  const idx = vault.records.findIndex((r) => r.token_sha256 === tokenSha)
  if (idx === -1) return false
  if (computeEffectiveStatus(vault.records[idx], nowMs) !== "active") return false

  vault.records[idx] = {
    ...vault.records[idx],
    status: "redeemed",
    redeemed_at: new Date(nowMs).toISOString(),
    application_id: params.applicationId,
  }
  return await saveEmployerShieldVault(vault)
}

export async function recordEmployerTalentShieldBelowThresholdCheck(params: {
  rawToken: string
  matchScore: number
}): Promise<boolean> {
  if (!isWellFormedEmployerTalentShieldToken(params.rawToken)) return false
  const vault = await loadEmployerShieldVault()
  const tokenSha = hashEmployerToken(params.rawToken)
  const nowMs = Date.now()
  const idx = vault.records.findIndex((r) => r.token_sha256 === tokenSha)
  if (idx === -1) return false
  if (computeEffectiveStatus(vault.records[idx], nowMs) !== "active") return false

  const prevAttempts = Number(vault.records[idx].below_threshold_attempts || 0)
  const cleanScore = Math.max(0, Math.min(100, Math.round(Number(params.matchScore || 0))))
  vault.records[idx] = {
    ...vault.records[idx],
    last_below_threshold_score: cleanScore,
    below_threshold_attempts: prevAttempts + 1,
    last_checked_at: new Date(nowMs).toISOString(),
  }
  return await saveEmployerShieldVault(vault)
}
