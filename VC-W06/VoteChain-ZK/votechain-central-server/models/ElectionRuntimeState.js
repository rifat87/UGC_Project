import mongoose from "mongoose"


const electionRuntimeStateSchema =
  new mongoose.Schema(
    {
      _id: {
        type: String,
        required: true,
        immutable: true,
      },

      currentElection: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Election",

        default:
          null,
      },
    },
    {
      timestamps:
        true,

      versionKey:
        false,

      autoCreate:
        false,

      autoIndex:
        false,

      collection:
        "election_runtime_state",
    },
  )


export default (
  mongoose.models
    .ElectionRuntimeState ||
  mongoose.model(
    "ElectionRuntimeState",
    electionRuntimeStateSchema,
  )
)
