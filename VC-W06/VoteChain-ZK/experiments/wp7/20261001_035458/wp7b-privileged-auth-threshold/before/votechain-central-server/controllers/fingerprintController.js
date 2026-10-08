// ... updated code:
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import Voter from '../models/Voter.js'
import { prepareProofAfterBiometricAuthentication } from '../services/zk/biometricProofGate.js'
import { generateVoteProofForVoter } from '../services/zk/proofService.js'
import { authorizeWp5Voter } from '../services/zk/wp5PrivacyService.js'

let parser
let serial
const serialPortPath = process.env.FINGERPRINT_SERIAL_PORT || 'COM3'

function initSerial() {
  if (!serial) {
    console.log(`[Serial] Initializing serial connection on ${serialPortPath}...`)
    serial = new SerialPort({ path: serialPortPath, baudRate: 115200 })
    parser = serial.pipe(new ReadlineParser({ delimiter: '\n' }))

    serial.on('open', () => {
      console.log(`[Serial] Serial port ${serialPortPath} opened successfully.`)
    })

    serial.on('error', (err) => {
      console.error("[Serial] Serial port error:", err.message)
    })
  }
}

function sendSerialJSON(obj) {
  return new Promise((resolve, reject) => {
    initSerial()

    const jsonStr = JSON.stringify(obj)
    console.log(`[Serial] Sending ${obj.cmd || 'UNKNOWN'} command`)

    const onData = (data) => {
      const clean = data.trim()
      console.log('[Serial] Received device response')
      try {
        const parsed = JSON.parse(clean)
        // Assume ESP32 always responds once per command
        parser.removeListener('data', onData)
        resolve(parsed)
      } catch {
        console.warn("[Serial] Ignored non-JSON data")
      }
    }

    parser.on('data', onData)

    serial.write(jsonStr + "\n", (err) => {
      if (err) {
        parser.removeListener('data', onData)
        console.error("[Serial] Failed to write to serial port:", err.message)
        reject(err)
      } else {
        console.log("[Serial] Command sent successfully.")
      }
    })
  })
}

// ================== API Controllers ==================

// ENROLL
const captureFingerprint = async (req, res) => {
  console.log("[API] /api/fingerprint/enroll called")
  const { nid } = req.body
  if (!nid) {
    return res.status(400).json({ success: false, message: "NID is required" })
  }

  try {
    const response = await sendSerialJSON({ cmd: "ENROLL", nid })
    console.log(`[API] ENROLL result: ${response.status || 'unknown'}`)

    if (response.status === "success" && response.action === "enroll") {
      return res.status(200).json({
        success: true,
        message: "Fingerprint enrollment successful"
      })
    }

    return res.status(400).json({
      success: false,
      message: "Enrollment failed"
    })
  } catch (error) {
    console.error("[API] Enrollment error:", error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

// DETECT
const detectFingerprint = async (req, res) => {
  console.log("[API] /api/fingerprint/detect called for ZK proof preparation")
  const candidateId = Number(req.body?.candidateId)
  if (!Number.isSafeInteger(candidateId) || candidateId <= 0) {
    return res.status(400).json({ success: false, message: "A positive candidateId is required before proof generation" })
  }

  try {
    const response = await sendSerialJSON({ cmd: "DETECT" })
    console.log(`[API] DETECT result: ${response.status || 'unknown'}`)

    if (response.status === "success" && response.action === "detect" && response.nid) {
      const voter = await Voter.findOne({ nationalId: response.nid })
      if (!voter) {
        return res.status(404).json({ success: false, message: "Fingerprint matched, but voter is not enrolled" })
      }

      const proofPayload = await prepareProofAfterBiometricAuthentication({ biometricAccepted: true, voter, candidateId, proofGenerator: generateVoteProofForVoter })
      return res.status(200).json({
        success: true,
        message: "Fingerprint match successful; anonymous eligibility proof prepared",
        data: proofPayload,
      })
    }

    return res.status(400).json({ success: false, message: "No match found" })
  } catch (error) {
    console.error("[API] Fingerprint ZK proof preparation failed:", error.message)
    return res.status(500).json({ success: false, message: "Unable to prepare anonymous eligibility proof" })
  }
}


const detectWp5Fingerprint = async (req, res) => {
  console.log(
    '[WP5] fingerprint DETECT called for candidate-blind authorization',
  )

  const credentialPublicKey =
    req.body?.credentialPublicKey

  if (!credentialPublicKey) {
    return res.status(400).json({
      success: false,
      message: 'credentialPublicKey is required',
    })
  }

  try {
    const response =
      await sendSerialJSON({ cmd: 'DETECT' })

    if (
      response.status === 'success' &&
      response.action === 'detect' &&
      response.nid
    ) {
      const voter = await Voter.findOne({
        nationalId: response.nid,
      })

      if (!voter) {
        return res.status(404).json({
          success: false,
          message:
            'Fingerprint matched, but voter is not enrolled',
        })
      }

      const authorization =
        await authorizeWp5Voter({
          voter,
          clientPublicKey:
            credentialPublicKey,
        })

      return res.status(200).json({
        success: true,
        message:
          'Fingerprint match successful; candidate-blind authorization issued',
        data: authorization,
      })
    }

    return res.status(401).json({
      success: false,
      message: 'No match found',
    })
  } catch (error) {
    console.error(
      '[WP5] fingerprint authorization failed:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to issue private-voting authorization',
    })
  }
}

// Optional: Format DB (if your ESP32 firmware supports it)
const formatFingerprintDatabase = async (req, res) => {
  console.log("[API] /api/fingerprint/format called")
  try {
    const response = await sendSerialJSON({ cmd: "FORMAT" })
    console.log(`[API] FORMAT result: ${response.status || 'unknown'}`)

    if (response.status === "success") {
      return res.status(200).json({ success: true, message: "Fingerprint database cleared" })
    }

    return res.status(400).json({ success: false, message: "Format failed" })
  } catch (error) {
    console.error("[API] Format error:", error.message)
    return res.status(500).json({ success: false, error: error.message })
  }
}

export default {
  captureFingerprint,
  detectFingerprint,
  detectWp5Fingerprint,
  formatFingerprintDatabase,
}