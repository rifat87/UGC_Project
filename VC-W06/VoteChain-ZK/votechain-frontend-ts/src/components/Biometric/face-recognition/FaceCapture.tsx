import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CheckCircle2 } from "lucide-react"
import {
  adminFetch,
} from "@/services/adminAuth"

interface FaceCaptureProps {
  nid: string
  onCaptureComplete: (success: boolean) => void
}

export function FaceCapture({ nid, onCaptureComplete }: FaceCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const totalImages = 10

  const handleStartCapture = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!nid) {
      setError("Please enter National ID first")
      return
    }

    setIsCapturing(true)
    setCurrentImage(0)
    setError(null)
    setProgress(0)

    try {
      const response = await adminFetch("/api/biometric/capture-face", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nid }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to capture face images")
      }

      const data = await response.json()

      if (data.output) {
        const matches = data.output.match(/Captured image (\d)\/5/g)
        if (matches) {
          const lastMatch = matches[matches.length - 1]
          const currentImage = parseInt(lastMatch.match(/\d/)[0])
          setCurrentImage(currentImage)
          setProgress((currentImage / totalImages) * 100)
        }
      }

      if (data.success) {
        setProgress(100)
        setCurrentImage(totalImages)
        onCaptureComplete(true)
      } else {
        throw new Error(data.message || "Face capture failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      onCaptureComplete(false)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              {isCapturing
                ? `Capturing image ${currentImage}/${totalImages}...`
                : "Ready to capture"}
            </span>
          </div>
          <Button
            onClick={handleStartCapture}
            disabled={isCapturing || !nid}
            className="w-40"
            type="button"
          >
            {isCapturing ? (
              "Capturing..."
            ) : currentImage === totalImages ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Complete
              </>
            ) : (
              "Start Capture"
            )}
          </Button>
        </div>

        {(isCapturing || progress > 0) && <Progress value={progress} className="w-full" />}

        <div className="text-sm text-muted-foreground text-center">
          {isCapturing
            ? "Please look at the camera and follow the instructions in the capture window"
            : currentImage === totalImages
            ? "Face capture completed successfully"
            : "Click 'Start Capture' to begin"}
        </div>
      </div>
    </Card>
  )
}
