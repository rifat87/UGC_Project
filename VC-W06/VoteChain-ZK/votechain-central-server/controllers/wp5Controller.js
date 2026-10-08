import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import Voter from '../models/Voter.js'
import {
  authorizeWp5Voter,
  getWp5PublicConfig,
} from '../services/zk/wp5PrivacyService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function credentialPublicKey(req) {
  return req.body?.credentialPublicKey
}

export async function getConfig(_req, res) {
  try {
    return res.json({
      success: true,
      data: await getWp5PublicConfig(),
    })
  } catch (error) {
    console.error('[WP5] public config failed:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Unable to load WP5 public configuration',
    })
  }
}

export async function authorizeFace(req, res) {
  try {
    const publicKey = credentialPublicKey(req)

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'credentialPublicKey is required',
      })
    }

    console.log('[WP5] Starting candidate-blind face authorization')

    /*
     * Runtime configuration is overrideable for deployments while retaining
     * the repository layout as the local-development default.
     */
    const faceRecognitionDir =
      process.env.FACE_RECOGNITION_DIR
        ? path.resolve(process.env.FACE_RECOGNITION_DIR)
        : path.resolve(__dirname, '../../votechain-face-recognition')

    const faceRecognitionScript =
      process.env.FACE_RECOGNITION_SCRIPT || 'face_rec_demo.py'

    const faceRecPath =
      path.resolve(faceRecognitionDir, faceRecognitionScript)

    const pythonExecutable =
      process.env.FACE_PYTHON_BIN || 'python'

    if (!fs.existsSync(faceRecPath)) {
      console.error(
        '[WP5] Face recognition script not found:',
        faceRecPath,
      )

      return res.status(500).json({
        success: false,
        message: 'Face recognition service is not configured correctly',
      })
    }

    const pythonProcess = spawn(
      pythonExecutable,
      [faceRecPath],
      {
        cwd: faceRecognitionDir,
        windowsHide: true,
      },
    )

    let stdout = ''
    let stderr = ''
    let responseSent = false

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    /*
     * Native ML libraries commonly write warnings and provider messages to
     * stderr. Capture them first; decide whether they represent a failure only
     * after the process exits.
     */
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', async (code) => {
      if (responseSent) return
      responseSent = true

      try {
        const normalizedOutput =
          stdout.toLowerCase()

        const recognitionSucceeded =
          normalizedOutput.includes('result = success')

        const recognitionFailed =
          normalizedOutput.includes('result = failed')

        if (stderr.trim()) {
          console.warn(
            '[WP5] Face recognition runtime diagnostics:\n' +
            stderr.trim(),
          )
        }

        /*
         * The Python recognition program defines:
         *   0 = successful biometric recognition
         *   1 = biometric/liveness rejection
         *   2 = runtime exception
         *
         * RESULT output is checked as well so the protocol remains explicit
         * instead of depending only on process exit status.
         */
        if (
          code === 1 ||
          (
            recognitionFailed &&
            code !== 2
          )
        ) {
          console.log(
            '[WP5] Face authorization rejected by biometric/liveness checks',
          )

          return res.status(401).json({
            success: false,
            message:
              'Face or liveness verification was not successful. Please try again.',
          })
        }

        if (
          code !== 0 ||
          !recognitionSucceeded
        ) {
          const pythonError =
            stdout
              .split(/\r?\n/)
              .find(line =>
                line.trim().startsWith('[ERROR]')
              )

          console.error(
            '[WP5] Face recognition runtime failed',
            {
              exitCode: code,
              detail:
                pythonError ||
                stderr.trim() ||
                'No diagnostic output',
            },
          )

          return res.status(500).json({
            success: false,
            message:
              'Face recognition service failed. Check the backend terminal for diagnostics.',
          })
        }

        const idMatch =
          stdout.match(
            /^Matched ID:\s*(.+?)\s*$/im,
          )

        const matchedNid =
          idMatch?.[1]?.trim()

        /*
         * Recognition determines the voter dynamically.
         * No voter NID is supplied by the voting UI.
         */
        if (
          !matchedNid ||
          !/^[A-Za-z0-9_-]+$/.test(matchedNid)
        ) {
          console.error(
            '[WP5] Successful face recognition returned an invalid voter identifier',
          )

          return res.status(422).json({
            success: false,
            message:
              'Face verification did not return a usable voter identity',
          })
        }

        const voter =
          await Voter.findOne({
            nationalId: matchedNid,
          })

        if (!voter) {
          return res.status(404).json({
            success: false,
            message:
              'Verified voter is not enrolled',
          })
        }

        /*
         * Candidate information never crosses this biometric boundary.
         * The matched voter receives only the temporary WP5 credential
         * authorization required by the local privacy worker.
         */
        const authorization =
          await authorizeWp5Voter({
            voter,
            clientPublicKey:
              publicKey,
          })

        console.log(
          '[WP5] Face verification succeeded; candidate-blind authorization issued',
        )

        return res.json({
          success: true,
          message:
            'Face verification successful; candidate-blind authorization issued',
          data:
            authorization,
        })
      } catch (error) {
        console.error(
          '[WP5] Face authorization failed:',
          error.message,
        )

        return res.status(500).json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to issue private-voting authorization',
        })
      }
    })

    pythonProcess.on('error', (error) => {
      if (responseSent) return
      responseSent = true

      console.error(
        '[WP5] Failed to start face recognition:',
        error.message,
      )

      return res.status(500).json({
        success: false,
        message:
          'Failed to launch face recognition service',
      })
    })
  } catch (error) {
    console.error(
      '[WP5] authorizeFace error:',
      error.message,
    )

    return res.status(500).json({
      success: false,
      message:
        'Internal server error',
    })
  }
}

