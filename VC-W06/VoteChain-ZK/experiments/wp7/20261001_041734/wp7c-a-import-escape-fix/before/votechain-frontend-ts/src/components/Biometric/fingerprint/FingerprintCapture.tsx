import { useState } from "react"
import { apiUrl } from "@/config/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {\n  adminFetch,\n} from "@/services/adminAuth"\n
interface FingerprintCaptureProps {
  nid: string
  onCapture: (nid: string) => void
  onRetake: () => void
  isCaptured: boolean
}

export function FingerprintCapture({ nid, onCapture, onRetake, isCaptured }: FingerprintCaptureProps) {
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFingerprintCapture = async () => {
    if (!nid) {
      setError("NID is required before capturing fingerprint")
      return
    }

    setIsEnrolling(true)
    setError(null)

    try {
      const response = await adminFetch("/api/biometric/fingerprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nid })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Fingerprint enrollment failed")
      }

      onCapture(nid)
    } catch (err) {
      console.error("Fingerprint error:", err)
      setError(err instanceof Error ? err.message : "Fingerprint capture failed")
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fingerprint Capture</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-center">
            {isCaptured ? (
              <>
                <p className="text-muted-foreground">Fingerprint captured successfully</p>
                <Button variant="outline" onClick={onRetake} className="mt-2">
                  Retake
                </Button>
              </>
            ) : isEnrolling ? (
              <p className="text-blue-600 animate-pulse">Waiting for fingerprint...</p>
            ) : (
              <p className="text-muted-foreground">Place finger on sensor</p>
            )}
          </div>

          {!isCaptured && (
            <Button onClick={handleFingerprintCapture} className="w-full" disabled={isEnrolling || !nid.trim()}>
              {isEnrolling ? "Capturing..." : "Capture Fingerprint"}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
