import mongoose from 'mongoose'

const voterSchema = new mongoose.Schema({
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
    unique: true,
    trim: true,
    match: [/^\d{10}$/, 'National ID must be exactly 10 digits'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    match: [/^[A-Za-z ]+$/, 'Name should contain only letters and spaces'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator(value) {
        if (!value) return false
        const today = new Date()
        let age = today.getFullYear() - value.getFullYear()
        const monthDifference = today.getMonth() - value.getMonth()
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < value.getDate())) age -= 1
        return age >= 18 && age <= 120
      },
      message: 'Voter must be between 18 and 120 years old',
    },
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [2, 'Location must be at least 2 characters long'],
    maxlength: [100, 'Location cannot exceed 100 characters'],
    match: [/^[A-Za-z ,.-]+$/, 'Location can only contain letters, spaces, commas, hyphens, and periods'],
  },

  // Active VoteChain-ZK identity material. The private Semaphore identity is never
  // stored in plaintext; only its public commitment and authenticated ciphertext are persisted.
  zkIdentityCommitment: {
    type: String,
    trim: true,
    match: [/^\d+$/, 'ZK identity commitment must be a decimal integer string'],
  },
  zkCredential: {
    version: { type: Number },
    iv: { type: String },
    ciphertext: { type: String },
    authTag: { type: String },
  },
  zkRegistrationStatus: {
    type: String,
    enum: ['pending', 'registered', 'failed', 'legacy'],
    default: 'legacy',
  },
  zkGroupIndex: {
    type: Number,
    min: 0,
    validate: {
      validator(value) {
        return value === undefined || value === null || Number.isSafeInteger(value)
      },
      message: 'ZK group index must be a safe integer',
    },
  },
  zkRegistrationTxHash: {
    type: String,
    trim: true,
  },

  // Historical VC-W01/VC-W02 fields. They remain readable for archived baseline
  // records only; new ZK enrollment does not populate or use them.
  voterHash: {
    type: String,
    trim: true,
  },
  encryptedSalt: {
    iv: { type: String },
    encryptedData: { type: String },
    authTag: { type: String },
  },
}, {
  timestamps: true,
  collection: 'voterCollection',
})

voterSchema.index({ nationalId: 1 })
voterSchema.index(
  { voterHash: 1 },
  {
    name: 'legacy_voterHash_unique_when_present',
    unique: true,
    partialFilterExpression: { voterHash: { $type: 'string' } },
  },
)
voterSchema.index(
  { zkIdentityCommitment: 1 },
  {
    name: 'zkIdentityCommitment_unique_when_present',
    unique: true,
    partialFilterExpression: { zkIdentityCommitment: { $type: 'string' } },
  },
)
voterSchema.index(
  { zkGroupIndex: 1 },
  {
    name: 'zkGroupIndex_unique_registered',
    unique: true,
    partialFilterExpression: {
      zkRegistrationStatus: 'registered',
      zkGroupIndex: { $type: 'number' },
    },
  },
)
voterSchema.index({ name: 'text', location: 'text' })

voterSchema.pre('save', function trimStringFields(next) {
  Object.keys(this.schema.paths).forEach((key) => {
    if (this.schema.paths[key].instance === 'String' && this[key]) this[key] = this[key].trim()
  })
  next()
})

voterSchema.post('save', function duplicateKeyError(error, _doc, next) {
  if ((error.name === 'MongoError' || error.name === 'MongoServerError') && error.code === 11000) {
    next(new Error('A voter with this National ID or ZK identity commitment already exists'))
  } else {
    next(error)
  }
})

const Voter = mongoose.model('Voter', voterSchema)
export default Voter
