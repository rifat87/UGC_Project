import Voter from '../models/Voter.js'
import { validationResult } from 'express-validator'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { spawn } from 'child_process'
import { toSafeVoterResponse, toZkVoterEnrollmentResponse } from '../services/privacyProjection.js'
import { createEncryptedSemaphoreIdentity } from '../services/zk/identityService.js'
import { getContract } from '../utils/contract.js'
import { createWp5Credential, allocateWp5GroupIndex } from '../services/zk/wp5PrivacyService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const handleTrainFace = async (req, res) => {
  try {
    const { nid } = req.params
    console.log('[Train Face] Starting face training for submitted voter record')

    const faceRecognitionPath = path.join(__dirname, '../../votechain-face-recognition')
    const datasetPath = path.join(faceRecognitionPath, 'dataset', nid)

    if (!fs.existsSync(datasetPath)) {
      return res.status(404).json({
        success: false,
        message: 'Face images not found. Please capture face images first.',
      })
    }

    const imageFiles = fs.readdirSync(datasetPath).filter((file) => file.endsWith('.jpg'))
    if (imageFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No face images found. Please capture face images first.',
      })
    }

    console.log(`[Train Face] Found ${imageFiles.length} face images for training`)

    const trainScript = path.join(faceRecognitionPath, 'train_faces.py')
    const trainProcess = spawn('python', [trainScript], {
      cwd: faceRecognitionPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    trainProcess.stdout.on('data', () => {})
    trainProcess.stderr.on('data', () => {})

    trainProcess.on('close', (code) => {
      console.log(`[Train Face] Training process finished with code: ${code}`)

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: 'Face training failed',
          code,
        })
      }

      return res.json({
        success: true,
        message: 'Face training completed successfully',
      })
    })

    trainProcess.on('error', () => {
      console.error('[Train Face] Failed to start training process')
      return res.status(500).json({
        success: false,
        message: 'Failed to start training process',
      })
    })
  } catch (_error) {
    console.error('[Train Face] Unexpected training endpoint error')
    return res.status(500).json({
      success: false,
      message: 'Failed to train face model',
    })
  }
}

const createVoter = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => err.msg),
      })
    }

    const { nationalId, name, dateOfBirth, location } = req.body

    // Do not create fresh election credentials after the chain has left Registration.
    // The contract remains the lifecycle authority; this backend check prevents orphaned
    // post-activation credentials from being created unnecessarily.
    const electionState = Number(await getContract().getElectionState())
    if (electionState !== 0) {
      return res.status(409).json({
        success: false,
        message: 'Voter ZK enrollment is only available during Registration',
      })
    }

    const existingVoter = await Voter.findOne({ nationalId })
    if (existingVoter) {
      return res.status(400).json({
        success: false,
        message: 'A voter with this National ID already exists',
      })
    }

    const { identityCommitment, encryptedCredential } = await createEncryptedSemaphoreIdentity()
    const wp5 = await createWp5Credential()
    const wp5GroupIndex = await allocateWp5GroupIndex()
    const voter = new Voter({
      nationalId,
      name,
      dateOfBirth,
      location,
      zkIdentityCommitment: identityCommitment,
      zkCredential: encryptedCredential,
      zkRegistrationStatus: 'pending',
      wp5IdentityCommitment: wp5.identityCommitment,
      wp5Credential: wp5.encryptedCredential,
      wp5RegistrationStatus: 'registered',
      wp5GroupIndex,
    })

    await voter.save()

    // The browser receives only the public commitment needed by the Election
    // Commission wallet. The private Semaphore identity remains encrypted server-side.
    const enrollment = toZkVoterEnrollmentResponse(voter)
    return res.status(201).json({
      success: true,
      message: 'Voter ZK identity created; on-chain commitment registration is pending',
      data: enrollment,
    })
  } catch (error) {
    console.error('Voter ZK enrollment failed:', error.message)

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map((err) => err.message),
      })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A voter with this National ID or ZK identity commitment already exists',
      })
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating voter ZK enrollment',
    })
  }
}

const updateZkRegistrationStatus = async (req, res) => {
  try {
    const { identityCommitment, registrationStatus, transactionHash } = req.body
    if (!/^\d+$/.test(String(identityCommitment || ''))) {
      return res.status(400).json({ success: false, message: 'Valid identityCommitment is required' })
    }
    if (!['registered', 'failed'].includes(registrationStatus)) {
      return res.status(400).json({ success: false, message: 'registrationStatus must be registered or failed' })
    }

    const voter = await Voter.findOne({ zkIdentityCommitment: String(identityCommitment) })
    if (!voter) return res.status(404).json({ success: false, message: 'Voter enrollment not found' })

    const contract = getContract()
    const onChain = await contract.registeredCommitments(BigInt(identityCommitment))

    if (registrationStatus === 'registered') {
      if (!onChain) {
        return res.status(409).json({ success: false, message: 'Commitment is not registered in the active ZK contract' })
      }
      const groupIndex = Number(await contract.getCommitmentIndex(BigInt(identityCommitment)))
      voter.zkRegistrationStatus = 'registered'
      voter.zkGroupIndex = groupIndex
      if (transactionHash) voter.zkRegistrationTxHash = String(transactionHash)
    } else {
      // Never let an API caller downgrade a commitment that the blockchain already
      // confirms as a member. Blockchain membership is the authority boundary.
      if (onChain) {
        return res.status(409).json({ success: false, message: 'Commitment is already registered on-chain and cannot be marked failed' })
      }
      voter.zkRegistrationStatus = 'failed'
      voter.zkGroupIndex = undefined
      if (transactionHash) voter.zkRegistrationTxHash = String(transactionHash)
    }

    await voter.save()
    return res.json({
      success: true,
      data: {
        identityCommitment: voter.zkIdentityCommitment,
        registrationStatus: voter.zkRegistrationStatus,
        groupIndex: voter.zkGroupIndex ?? null,
      },
    })
  } catch (error) {
    console.error('Voter ZK registration reconciliation failed:', error.message)
    return res.status(500).json({ success: false, message: 'Failed to reconcile voter commitment registration' })
  }
}

const updateVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.query.id)
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' })
    }

    const { nationalId, name, dateOfBirth, location } = req.body

    voter.nationalId = nationalId || voter.nationalId
    voter.name = name || voter.name
    voter.dateOfBirth = dateOfBirth || voter.dateOfBirth
    voter.location = location || voter.location

    await voter.save()

    return res.json({
      message: 'Voter updated successfully',
      voter: toSafeVoterResponse(voter),
    })
  } catch (error) {
    console.error('Voter update failed:', error.message)
    return res.status(500).json({ message: 'Error updating voter' })
  }
}

const deleteVoter = async (req, res) => {
  try {
    const voter = await Voter.findById(req.query.id)
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' })
    }

    if (voter.zkRegistrationStatus === 'registered') {
      return res.status(409).json({
        message: 'A voter with an on-chain ZK commitment cannot be deleted from the active election record',
      })
    }

    await voter.deleteOne()
    return res.json({ message: 'Voter deleted successfully' })
  } catch (error) {
    console.error('Voter deletion failed:', error.message)
    return res.status(500).json({ message: 'Error deleting voter' })
  }
}

export default {
  createVoter,
  updateZkRegistrationStatus,
  updateVoter,
  deleteVoter,
  handleTrainFace,
}
