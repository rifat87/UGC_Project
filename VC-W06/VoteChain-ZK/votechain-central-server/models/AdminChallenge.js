
import mongoose from "mongoose"

const adminChallengeSchema =
  new mongoose.Schema({
    challengeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    path: {
      type: String,
      required: true,
    },

    bodyHash: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    audience: {
      type: String,
      required: true,
    },

    chainId: {
      type: String,
      required: true,
    },

    issuedAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    usedAt: Date,
  }, {
    timestamps: true,
  })

adminChallengeSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
)

export default (
  mongoose.models.AdminChallenge ||
  mongoose.model(
    "AdminChallenge",
    adminChallengeSchema,
  )
)
