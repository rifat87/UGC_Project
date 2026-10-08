import {
  useState,
} from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Button,
} from "@/components/ui/button"
import {
  Fingerprint,
  Loader2,
  ScanFace,
} from "lucide-react"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  authorizeWp5,
  type Wp5Authorization,
} from "@/services/api"
import {
  beginWp5Authorization,
  resetWp5PrivacySession,
} from "@/privacy/wp5PrivacyClient"

interface VerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified:
    (
      authorization:
        Wp5Authorization,
    ) => Promise<void>
}

export function VerificationModal({
  open,
  onClose,
  onVerified,
}: VerificationModalProps) {
  const {
    toast,
  } =
    useToast()

  const [
    isVerifying,
    setIsVerifying,
  ] =
    useState(false)

  const [
    status,
    setStatus,
  ] =
    useState<string | null>(
      null,
    )

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const runVerification =
    async (
      path:
        "/api/wp5/authorize/face" |
        "/api/wp5/authorize/fingerprint",
      label:
        string,
    ) => {
      setError(null)
      setIsVerifying(true)
      setStatus(
        `Waiting for ${label.toLowerCase()} verification...`,
      )

      try {
        /*
         * The private half of this ephemeral ECDH key
         * exists only inside the local privacy worker.
         */
        const {
          credentialPublicKey,
        } =
          await beginWp5Authorization()

        /*
         * Candidate selection is deliberately absent
         * from this network request.
         */
        const authorization =
          await authorizeWp5(
            path,
            credentialPublicKey,
          )

        setStatus(
          "Biometric verification passed. Preparing the encrypted ballot locally...",
        )

        toast({
          title:
            `${label} Verified`,
          description:
            "Candidate-blind credential authorization succeeded.",
        })

        /*
         * Parent performs local encryption/proving and
         * blockchain submission. This promise is awaited
         * so the worker session remains alive until the
         * credential has been consumed.
         */
        await onVerified(
          authorization,
        )
      } catch (
        verificationError
      ) {
        /*
         * Failed biometric/API/proof attempts must discard the
         * ephemeral credential-release session so a retry starts cleanly.
         */
        resetWp5PrivacySession()

        setError(
          verificationError
            instanceof Error
            ? verificationError.message
            : "Private-voting preparation failed",
        )

        setStatus(null)
      } finally {
        setIsVerifying(false)
      }
    }

  return (
    <Dialog
      open={open}
      onOpenChange={
        value => {
          if (
            !value &&
            !isVerifying
          ) {
            onClose()
          }
        }
      }
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Biometric Verification
          </DialogTitle>

          <DialogDescription>
            Biometrics authorize temporary access to the
            protected VoteChain-ZK credential. Candidate
            selection is not sent to the biometric or API
            server.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive mb-2">
            {error}
          </p>
        )}

        {status && (
          <p className="text-sm text-muted-foreground">
            {status}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <Button
            disabled={
              isVerifying
            }
            onClick={() =>
              runVerification(
                "/api/wp5/authorize/face",
                "Face",
              )
            }
            className="w-full flex items-center gap-2"
          >
            {isVerifying
              ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              )
              : (
                <ScanFace className="h-4 w-4" />
              )}

            Verify with Face
          </Button>

          <Button
            variant="outline"
            disabled={
              isVerifying
            }
            onClick={() =>
              runVerification(
                "/api/wp5/authorize/fingerprint",
                "Fingerprint",
              )
            }
            className="w-full flex items-center gap-2"
          >
            {isVerifying
              ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              )
              : (
                <Fingerprint className="h-4 w-4" />
              )}

            Verify with Fingerprint
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={
              onClose
            }
            disabled={
              isVerifying
            }
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
