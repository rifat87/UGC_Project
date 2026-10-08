import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ScanFace, Fingerprint } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { prepareZkVote, type ZkVotePreparation } from "@/services/api"

interface VerificationModalProps {
  open: boolean
  candidateId: number | null
  onClose: () => void
  onVerified: (preparation: ZkVotePreparation) => void
}

export function VerificationModal({ open, candidateId, onClose, onVerified }: VerificationModalProps) {
  const { toast } = useToast()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runVerification = async (path: string, label: string) => {
    if (!candidateId) return
    setError(null)
    setIsVerifying(true)
    try {
      const preparation = await prepareZkVote(path, candidateId)
      toast({ title: `${label} Verified`, description: "Preparing anonymous eligibility proof completed." })
      onVerified(preparation)
      onClose()
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : "Unknown verification error")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Biometric Verification</DialogTitle>
          <DialogDescription>
            Verify the voter. After a successful match, the backend uses the encrypted Semaphore credential internally to prepare an anonymous eligibility proof.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        {isVerifying && <p className="text-sm text-muted-foreground">Preparing anonymous eligibility proof...</p>}
        <div className="flex flex-col gap-4">
          <Button disabled={isVerifying || !candidateId} onClick={() => runVerification("/api/votes/verify-face", "Face")} className="w-full flex items-center gap-2">
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}Verify with Face
          </Button>
          <Button variant="outline" disabled={isVerifying || !candidateId} onClick={() => runVerification("/api/biometric/fingerprint/detect", "Fingerprint")} className="w-full flex items-center gap-2">
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4" />}Verify with Fingerprint
          </Button>
        </div>
        <DialogFooter className="mt-4"><Button variant="ghost" onClick={onClose} disabled={isVerifying}>Cancel</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
