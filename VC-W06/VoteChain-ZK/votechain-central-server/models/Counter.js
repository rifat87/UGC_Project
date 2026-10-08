import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, {
  versionKey: false,
  collection: 'countersCollection',
})

const Counter = mongoose.model('Counter', counterSchema)

export default Counter
