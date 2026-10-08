import { apiUrl } from "@/config/api"
import {
  adminFetch,
} from "@/services/adminAuth"

export type ElectionState = "Registration" | "Active" | "Ended"

export interface PublicCandidate {
  candidateId: number
  name: string
  party: string
  location: string
  voteCount: number
}

export interface PublicElectionData {
  electionState: ElectionState
  candidateCount: number
  candidates: PublicCandidate[]
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method =
    (init?.method || "GET").toUpperCase()

  const privileged =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    (
      path.startsWith("/api/candidates") ||
      path.startsWith("/api/voters") ||
      path.startsWith("/api/biometric") ||
      path.startsWith("/api/elections")
    )

  const response =
    privileged
      ? await adminFetch(path, init)
      : await fetch(apiUrl(path), init)
  const payload = (await response.json()) as ApiEnvelope<T>

  if (!response.ok || payload.success === false) {
    const detail = payload.errors?.join(", ") || payload.message || `Request failed with ${response.status}`
    throw new Error(detail)
  }

  if (payload.data === undefined) {
    throw new Error("API response did not contain data")
  }

  return payload.data
}

export async function getPublicElectionData() {
  return request<PublicElectionData>("/api/elections/public/election-data")
}

export interface CandidateMetadataInput {
  nationalId: string
  name: string
  party: string
  location: string
  age: number
}

export interface CandidateAdminRecord {
  id: string
  candidateId: number
  name: string
  party: string
  location: string
  age: number
  registrationStatus: "pending" | "registered" | "failed"
}

export async function createCandidateMetadata(metadata: CandidateMetadataInput) {
  return request<CandidateAdminRecord>("/api/candidates/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  })
}

export async function reconcileCandidateRegistration(
  candidateId: number,
  transactionHash: string,
) {
  const response =
    await fetch(
      apiUrl(
        "/api/registration-reconciliation/candidate",
      ),
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            candidateId,
            transactionHash,
          }),
      },
    )

  const payload =
    await response.json()

  if (
    !response.ok ||
    !payload.success
  ) {
    throw new Error(
      payload.message ||
      "Failed to verify candidate blockchain registration",
    )
  }

  return payload.data as {
    candidateId: number
    registrationStatus: string
    transactionHash: string
  }
}


export async function updateCandidateRegistrationStatus(
  candidateId: number,
  registrationStatus: "pending" | "registered" | "failed",
) {
  return request<{ candidateId: number; registrationStatus: string }>(
    `/api/candidates/${candidateId}/registration-status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationStatus }),
    },
  )
}

export interface CreateVoterInput {
  nationalId: string
  name: string
  dateOfBirth: string
  location: string
}

export interface VoterCreationResult {
  identityCommitment: string
}

export interface SemaphoreProofPayload {
  merkleTreeDepth: number
  merkleTreeRoot: string
  nullifier: string
  message: string
  scope: string
  points: [string, string, string, string, string, string, string, string]
}

export interface ZkVotePreparation {
  candidateId: number
  electionId: string
  proof: SemaphoreProofPayload
}

export async function createVoter(input: CreateVoterInput) {
  const response = await adminFetch("/api/voters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const payload = await response.json()

  if (!response.ok || !payload.success) throw new Error(payload.message || "Failed to create voter ZK enrollment")
  const identityCommitment = payload.data?.identityCommitment || payload.identityCommitment
  if (!identityCommitment) throw new Error("Identity commitment was not returned from backend")
  return { identityCommitment: String(identityCommitment) } as VoterCreationResult
}

export async function reconcileVoterRegistration(
  identityCommitment: string,
  transactionHash: string,
) {
  const response =
    await fetch(
      apiUrl(
        "/api/registration-reconciliation/voter",
      ),
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            identityCommitment,
            transactionHash,
          }),
      },
    )

  const payload =
    await response.json()

  if (
    !response.ok ||
    !payload.success
  ) {
    throw new Error(
      payload.message ||
      "Failed to verify voter blockchain registration",
    )
  }

  return payload.data as {
    identityCommitment: string
    registrationStatus: string
    groupIndex: number | null
    transactionHash: string
  }
}


export async function updateVoterZkRegistrationStatus(
  identityCommitment: string,
  registrationStatus: "registered" | "failed",
  transactionHash?: string,
) {
  const response = await adminFetch("/api/voters/zk-registration-status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identityCommitment, registrationStatus, transactionHash }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) throw new Error(payload.message || "Failed to reconcile voter commitment registration")
  return payload.data as { identityCommitment: string; registrationStatus: string; groupIndex: number | null }
}

export async function prepareZkVote(path: string, candidateId: number) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateId }),
  })
  const payload = await response.json()
  if (!response.ok || !payload.success) throw new Error(payload.message || "Biometric verification or proof generation failed")
  const data = payload.data || payload
  if (!data?.proof) throw new Error("Anonymous eligibility proof was not returned")
  return data as ZkVotePreparation
}


/*
 * VoteChain-ZK WP5 private-voting API.
 *
 * Candidate selection never enters the authorization request.
 */
export interface Wp5Candidate {
  candidateId: number
  name: string
  party: string
  location: string
}

export interface Wp5ElectionConfig {
  eligibleRoot: string
  electionId: string
  candidateManifestHash: string
  candidateCount: string
  contractDomain: string
  Yx: string
  Yy: string
  electionContextHash: string
}

export interface Wp5PublicConfig {
  directContractAddress: string
  profile: string
  phase: number
  configured: boolean
  acceptedBallotCount: string
  candidates: Wp5Candidate[]
  manifestAlgorithm: string
  config: Wp5ElectionConfig
}

export interface Wp5MembershipWitness {
  identityCommitment: string
  index: number
  eligibleRoot: string
  siblings: string[]
  pathBits: string[]
}

export interface Wp5CredentialEnvelope {
  version: number
  keyAgreement: string
  contentEncryption: string
  serverPublicKey: JsonWebKey
  salt: string
  iv: string
  aad: string
  ciphertext: string
  expiresAt: number
}

export interface Wp5Authorization {
  version: string
  electionId: string
  expiresAt: number
  membership: Wp5MembershipWitness
  credentialEnvelope: Wp5CredentialEnvelope
}

export async function getWp5PublicConfig() {
  return request<Wp5PublicConfig>(
    "/api/wp5/config",
  )
}

export async function authorizeWp5(
  path: "/api/wp5/authorize/face" |
        "/api/wp5/authorize/fingerprint",
  credentialPublicKey: JsonWebKey,
) {
  return request<Wp5Authorization>(
    path,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credentialPublicKey,
      }),
    },
  )
}


export interface CreatedElection {
  electionId: string
  status: "registration"
  chainId: string
  createdAt: string
}

export async function createElection() {
  return request<CreatedElection>(
    "/api/elections",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  )
}

export interface CurrentElectionLifecycle {
  electionId: string
  status:
    | "registration"
    | "starting"
    | "active"
    | "ended"
    | "finalized"
    | "failed"
    | "orphaned"
  startStage: string | null
  chainId: string | null
  eligibleVoterCount: number | null
  candidateCount: number | null
  eligibleRoot: string | null
  candidateManifestHash: string | null
  trusteeTranscriptHash: string | null
  verifierAddress: string | null
  directContractAddress: string | null
  acceptedBallotCount: string
  finalizationTranscriptHash: string | null
  finalResults: string[]
  startedAt: string | null
  endedAt: string | null
  finalizedAt: string | null
}

export async function getCurrentElectionLifecycle() {
  const response =
    await fetch(
      apiUrl(
        "/api/elections/current",
      ),
    )

  const payload =
    await response.json()

  if (
    !response.ok ||
    payload.success === false
  ) {
    throw new Error(
      payload.message ||
      "Failed to fetch current election lifecycle",
    )
  }

  return (
    payload.data ??
    null
  ) as CurrentElectionLifecycle | null
}

export interface TrusteeTranscriptStored {
  electionId: string
  trusteeTranscriptHash: string
}

export async function setTrusteeTranscript(
  electionId: string,
  transcript: unknown,
) {
  const response = await adminFetch(`/api/elections/${electionId}/trustee-transcript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript }),
  })

  const payload = await response.json()

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Failed to store trustee transcript")
  }

  return payload.data as TrusteeTranscriptStored
}

export async function startCurrentElection(
  electionId: string,
) {
  const path =
    `/api/elections/${electionId}/start`

  const response =
    await adminFetch(
      path,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({}),
      },
    )

  const payload =
    await response.json()

  if (
    !response.ok ||
    !payload.success
  ) {
    throw new Error(
      payload.message ||
      "Failed to start election",
    )
  }

  return payload.data
}


export interface FinalizedCandidateResult {
  slot: number
  candidateId: number
  name: string
  party: string
  location: string
  votes: string
}


export interface FinalizedElectionResults {
  electionId: string
  status: "finalized"
  acceptedBallotCount: string
  finalizationTranscriptHash: string
  finalizedAt: string | null
  results: FinalizedCandidateResult[]
}


export async function endCurrentElection(
  electionId: string,
) {
  return request<{
    electionId: string
    status: "ended"
    alreadyEnded: boolean
    acceptedBallotCount: string
    candidateCount: number
  }>(
    `/api/elections/${electionId}/end`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({}),
    },
  )
}


export async function finalizeCurrentElection(
  electionId: string,
) {
  return request<{
    electionId: string
    status: "finalized"
    alreadyFinalized: boolean
    acceptedBallotCount: string
    finalizationTranscriptHash: string
    results: FinalizedCandidateResult[]
  }>(
    `/api/elections/${electionId}/finalize`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({}),
    },
  )
}


export async function getElectionResults(
  electionId: string,
) {
  return request<FinalizedElectionResults>(
    `/api/elections/${electionId}/results`,
  )
}


export async function getLatestFinalizedElectionResults() {
  return request<FinalizedElectionResults>(
    "/api/elections/latest/results",
  )
}
