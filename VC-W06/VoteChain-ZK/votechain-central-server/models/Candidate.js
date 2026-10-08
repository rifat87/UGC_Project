import mongoose from 'mongoose'

export const CANDIDATE_REGISTRATION_STATUSES = ['pending', 'registered', 'failed']

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: Number,
    required: [true, 'Candidate ID is required'],
    immutable: true,
    min: [1, 'Candidate ID must be a positive integer'],
    validate: {
      validator: Number.isSafeInteger,
      message: 'Candidate ID must be a safe integer',
    },
  },
  electionId: {
    type: String,
    required: [true, 'Election ID is required'],
    immutable: true,
    trim: true,
    match: [/^\d+$/, 'Election ID must be a positive decimal integer'],
  },
  nationalId: {
    type: String,
    required: [true, 'National ID is required'],
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
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    minlength: [2, 'Location must be at least 2 characters long'],
    maxlength: [100, 'Location cannot exceed 100 characters'],
    match: [/^[A-Za-z ,.-]+$/, 'Location can only contain letters, spaces, commas, hyphens, and periods'],
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18'],
    max: [120, 'Age cannot exceed 120'],
  },
  party: {
    type: String,
    required: [true, 'Party name is required'],
    trim: true,
    minlength: [2, 'Party name must be at least 2 characters long'],
    maxlength: [40, 'Party name cannot exceed 40 characters'],
    match: [/^[A-Za-z ]+$/, 'Party name should contain only letters and spaces'],
  },
  registrationStatus: {
    type: String,
    enum: CANDIDATE_REGISTRATION_STATUSES,
    default: 'pending',
    required: true,
  },

  registrationTxHash: {
    type: String,
    trim: true,
    match: [/^0x[0-9a-fA-F]{64}$/, 'Invalid candidate registration transaction hash'],
  },

  registrationContractAddress: {
    type: String,
    trim: true,
  },

  registrationConfirmedAt: Date,
}, {
  timestamps: true,
  collection: 'candidatesCollection',
})

candidateSchema.index(
  { candidateId: 1 },
  {
    name: 'candidateId_unique_valid',
    unique: true,
    partialFilterExpression: { candidateId: { $type: 'number', $gte: 1 } },
  },
)
candidateSchema.index(
  { electionId: 1, nationalId: 1 },
  { unique: true },
)

candidateSchema.index({ name: 'text', party: 'text', location: 'text' })

candidateSchema.pre('save', function trimStrings(next) {
  Object.keys(this.schema.paths).forEach((key) => {
    if (this.schema.paths[key].instance === 'String' && typeof this[key] === 'string') {
      this[key] = this[key].trim()
    }
  })
  next()
})

const Candidate = mongoose.model('Candidate', candidateSchema)

export default Candidate
