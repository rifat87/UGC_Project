import mongoose from "mongoose"

const electionMembershipSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Election",
    required: true,
    index: true,
  },

  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voter",
    required: true,
    index: true,
  },

  identityCommitment: {
    type: String,
    required: true,
  },

  merkleIndex: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
})

electionMembershipSchema.index(
  { election: 1, voter: 1 },
  { unique: true },
)

electionMembershipSchema.index(
  { election: 1, merkleIndex: 1 },
  { unique: true },
)

electionMembershipSchema.index(
  { election: 1, identityCommitment: 1 },
  { unique: true },
)

export default mongoose.models.ElectionMembership ||
  mongoose.model(
    "ElectionMembership",
    electionMembershipSchema,
  )
