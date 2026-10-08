import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Voter from '../models/Voter.js'

dotenv.config()

if (process.env.MIGRATION_ALLOW_RUN !== 'true') {
  console.error('Refusing to run: set MIGRATION_ALLOW_RUN=true only for the intended database migration.')
  process.exit(1)
}
if (!process.env.MONGO_URI) {
  console.error('Refusing to run: MONGO_URI must explicitly identify the intended database.')
  process.exit(1)
}

await mongoose.connect(process.env.MONGO_URI)
try {
  // Existing VC-W01/VC-W02 voters are deliberately NOT converted by deriving a
  // Semaphore identity from civil identity or voterHash. They must be re-enrolled
  // with a fresh random identity through the ZK enrollment flow.
  const result = await Voter.updateMany(
    {
      zkIdentityCommitment: { $exists: false },
      $or: [
        { zkRegistrationStatus: { $exists: false } },
        { zkRegistrationStatus: null },
      ],
    },
    { $set: { zkRegistrationStatus: 'legacy' } },
  )
  console.log(`Marked ${result.modifiedCount} legacy voter records for ZK re-enrollment.`)
} finally {
  await mongoose.disconnect()
}
