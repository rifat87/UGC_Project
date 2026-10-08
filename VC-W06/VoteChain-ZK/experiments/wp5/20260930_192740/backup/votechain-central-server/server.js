import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import voterRoutes from './routes/voterRoutes.js'
import candidateRoutes from './routes/candidateRoutes.js'
import electionRoutes from './routes/electionRoutes.js'
import voteRoutes from './routes/voteRoutes.js'
import biometricRoutes from './routes/biometricRoutes.js'
import blockchainRoutes from './routes/blockchainRoutes.js'
import { getServerConfig } from './config/env.js'

const { port, mongoUri, frontendOrigins } = getServerConfig()
const app = express()

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...frontendOrigins],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
    },
  },
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}))

app.use(cors({
  origin: frontendOrigins.length > 0 ? frontendOrigins : false,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((error) => console.error('MongoDB connection error:', error.message))

app.use('/api/voters', voterRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/elections', electionRoutes)
app.use('/api/votes', voteRoutes)
app.use('/api/biometric', biometricRoutes)
app.use('/api/blockchain', blockchainRoutes)

app.use((error, _req, res, _next) => {
  console.error(error.stack)
  res.status(500).json({ success: false, message: 'Something went wrong!' })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
