import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Candidate from '../models/Candidate.js'
import Counter from '../models/Counter.js'
import { migrateCandidateIdsWithModels } from '../services/candidateMigration.js'

dotenv.config()

async function migrateCandidateIds() {
  if (process.env.MIGRATION_ALLOW_RUN !== 'true') {
    throw new Error('Migration blocked. Set MIGRATION_ALLOW_RUN=true only for the intended safe database.')
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const result = await migrateCandidateIdsWithModels({
    CandidateModel: Candidate,
    CounterModel: Counter,
  })

  console.log(`Candidate ID migration complete. Records migrated: ${result.migrated}; skipped: ${result.skipped}`)
  console.log(`Candidate ID index: ${result.indexName}; highest pre-existing candidateId: ${result.highestExistingCandidateId}`)
}

migrateCandidateIds()
  .catch((error) => {
    console.error(`Candidate ID migration failed: ${error.message}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
