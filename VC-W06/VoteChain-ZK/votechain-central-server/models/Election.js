import mongoose from "mongoose"

const candidateSnapshotSchema = new mongoose.Schema({
  candidateRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  candidateId: {
    type: Number,
    required: true,
  },
  slot: {
    type: Number,
    required: true,
  },
  name: String,
  party: String,
  location: String,
}, {
  _id: false,
})

const electionSchema = new mongoose.Schema({
  electionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  status: {
    type: String,
    enum: [
      "registration",
      "starting",
      "active",
      "ended",
      "finalized",
      "failed",
      "orphaned",
    ],
    default: "registration",
    index: true,
  },

  chainId: String,

  adminAddress: {
    type: String,
    trim: true,
  },

  lifecycleSlot: {
    type: String,
    enum: ["current"],
    unique: true,
    sparse: true,
  },

  directContractAddress: String,
  verifierAddress: String,

  eligibleRoot: String,
  eligibleVoterCount: Number,
  candidateManifestHash: String,
  candidateCount: Number,

  contractDomain: String,
  Yx: String,
  Yy: String,
  electionContextHash: String,

  trusteeTranscriptHash: String,
  trusteeTranscript: {
    type: mongoose.Schema.Types.Mixed,
  },
  trusteeTranscriptVerifiedAt: Date,
  finalizationTranscriptHash: String,

  /*
   * Public WP6 finalization evidence.
   *
   * No trustee secret/share plaintext is stored here.
   * The transcript contains only public threshold-decryption
   * evidence and remains independently re-verifiable.
   */
  finalizationTranscript: {
    type: mongoose.Schema.Types.Mixed,
  },

  aggregateCiphertexts: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

  finalResults: {
    type: [String],
    default: [],
  },

  acceptedBallotCount: {
    type: String,
    default: "0",
  },

  candidateSnapshot: {
    type: [candidateSnapshotSchema],
    default: [],
  },

  snapshotLockedAt: Date,
  startedAt: Date,
  endedAt: Date,
  finalizedAt: Date,

  startStage: {
    type: String,
    enum: [
      "snapshotting",
      "snapshot_ready",
      "deployed",
      "configured",
      "trustees_pinned",
      "active",
    ],
  },

  failureReason: String,

  chainHealth: {
    type: String,
    enum: [
      "healthy",
      "unreachable",
      "mismatch",
      "orphaned",
    ],
  },

  chainHealthReason: String,
  lastChainReconciledAt: Date,
  orphanedAt: Date,

}, {
  timestamps: true,
})

export default mongoose.models.Election ||
  mongoose.model("Election", electionSchema)
