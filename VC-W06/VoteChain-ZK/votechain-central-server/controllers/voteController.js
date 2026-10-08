import Voter from '../models/Voter.js'
import { prepareProofAfterBiometricAuthentication } from '../services/zk/biometricProofGate.js'
import { generateVoteProofForVoter } from '../services/zk/proofService.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseCandidateId(value) {
  const candidateId = Number(value)
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0) return null
  return candidateId
}

export const verifyFace = async (req, res) => {
  const candidateId = parseCandidateId(req.body?.candidateId)
  if (!candidateId) {
    return res.status(400).json({ success: false, message: 'A positive candidateId is required before proof generation' })
  }

  try {
    console.log('[VoteController] Starting biometric-gated ZK proof preparation')
    const faceRecPath = path.join(__dirname, '../../votechain-face-recognition', 'face_rec_demo.py')
    const faceRecDir = path.dirname(faceRecPath)

    if (!fs.existsSync(faceRecPath)) {
      return res.status(500).json({ success: false, message: 'Face recognition script not found' })
    }

    const pythonProcess = spawn('python', [faceRecPath], { cwd: faceRecDir })
    let stdout = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    pythonProcess.stderr.on('data', () => {
      console.error('[VoteController] face-recognition process reported an error')
    })

    pythonProcess.on('close', async (code) => {
      try {
        if (code !== 0) {
          return res.status(500).json({ success: false, message: 'Face recognition process failed' })
        }

        const outputLower = stdout.toLowerCase()
        const isSuccess = outputLower.includes('face recognition successful') || outputLower.includes('result = success')
        if (!isSuccess) return res.json({ success: false, message: 'Face not recognised' })

        const idMatch = stdout.match(/Matched ID:\s*([\w-]+)/i)
        const matchedNid = idMatch ? idMatch[1].trim() : null
        if (!matchedNid) {
          return res.status(422).json({ success: false, message: 'Face verification did not return a usable voter identity' })
        }

        const voter = await Voter.findOne({ nationalId: matchedNid })
        if (!voter) return res.status(404).json({ success: false, message: 'Verified voter is not enrolled' })

        const proofPayload = await prepareProofAfterBiometricAuthentication({ biometricAccepted: true, voter, candidateId, proofGenerator: generateVoteProofForVoter })
        return res.json({
          success: true,
          message: 'Face verification successful; anonymous eligibility proof prepared',
          data: proofPayload,
        })
      } catch (error) {
        console.error('[VoteController] ZK proof preparation failed:', error.message)
        return res.status(500).json({ success: false, message: 'Unable to prepare anonymous eligibility proof' })
      }
    })

    pythonProcess.on('error', (error) => {
      console.error('[VoteController] Failed to start face recognition:', error.message)
      return res.status(500).json({ success: false, message: 'Failed to launch face recognition' })
    })
  } catch (error) {
    console.error('[VoteController] verifyFace error:', error.message)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}
