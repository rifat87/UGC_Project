import { useEffect, useState } from "react"
import { useContract } from "@/hooks/useContract"
import { useWallet } from "@/components/ui/wallet-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { FaceCapture } from "@/components/Biometric/face-recognition/FaceCapture"
import { FingerprintCapture } from "@/components/Biometric/fingerprint/FingerprintCapture"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createVoter, updateVoterZkRegistrationStatus, type ElectionState } from "@/services/api"
import {
  adminFetch,
} from "@/services/adminAuth"

interface FormData {
  name: string
  nationalId: string
  dateOfBirth: Date
  location: string
}

export function RegisterVoter() {
  const navigate = useNavigate()
  const { registerVoterCommitment, getElectionState, isAdmin, isInitialized } = useContract()
  const { address } = useWallet()
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    nationalId: "",
    dateOfBirth: new Date(2000, 0, 1),
    location: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [electionState, setElectionState] = useState<ElectionState | null>(null)
  const [biometricStatus, setBiometricStatus] = useState({
    faceCaptured: false,
    fingerprintCaptured: false,
    faceTrainingProgress: 0,
    isTraining: false,
  })

  useEffect(() => {
    if (isInitialized) {
      void getElectionState().then(setElectionState).catch(() => setElectionState(null))
    }
  }, [isInitialized, getElectionState])

  const handleTrainFace = async () => {
    if (!formData.nationalId.trim() || !biometricStatus.faceCaptured) {
      toast({ title: "Error", description: "Enter the National ID and capture face images first", variant: "destructive" })
      return
    }

    setBiometricStatus((previous) => ({ ...previous, isTraining: true, faceTrainingProgress: 0 }))
    try {
      const response = await adminFetch(`/api/voters/train-face/${formData.nationalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.message || "Failed to train face model")
      setBiometricStatus((previous) => ({ ...previous, faceTrainingProgress: 100, isTraining: false }))
      toast({ title: "Success", description: "Face training completed successfully" })
    } catch (trainingError) {
      setBiometricStatus((previous) => ({ ...previous, isTraining: false, faceTrainingProgress: 0 }))
      toast({ title: "Error", description: trainingError instanceof Error ? trainingError.message : "Failed to train face model", variant: "destructive" })
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!address || !isAdmin) {
      toast({ title: "Error", description: "Only the Election Commission wallet can register voters", variant: "destructive" })
      return
    }
    if (!biometricStatus.faceCaptured) {
      toast({ title: "Error", description: "Please capture face biometric data", variant: "destructive" })
      return
    }

    const currentState = await getElectionState()
    setElectionState(currentState)
    if (currentState !== "Registration") {
      toast({ title: "Registration closed", description: `Voter registration is unavailable while the election is ${currentState}.`, variant: "destructive" })
      return
    }

    const today = new Date()
    let age = today.getFullYear() - formData.dateOfBirth.getFullYear()
    const monthDifference = today.getMonth() - formData.dateOfBirth.getMonth()
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < formData.dateOfBirth.getDate())) age -= 1
    if (age < 18 || age > 120) {
      toast({ title: "Error", description: "Voter must be between 18 and 120 years old", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const { identityCommitment } = await createVoter({
        name: formData.name,
        nationalId: formData.nationalId,
        dateOfBirth: formData.dateOfBirth.toISOString(),
        location: formData.location,
      })

      try {
        const receipt = await registerVoterCommitment(identityCommitment)
        await updateVoterZkRegistrationStatus(identityCommitment, "registered", receipt?.hash)
      } catch (chainError) {
        await updateVoterZkRegistrationStatus(identityCommitment, "failed").catch(() => undefined)
        throw chainError
      }

      toast({ title: "Success", description: "Voter Semaphore commitment registered on-chain successfully" })
      navigate("/admin")
    } catch (registrationError) {
      const message = registrationError instanceof Error ? registrationError.message : "Failed to register voter"
      setError(message)
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const registrationOpen = electionState === null || electionState === "Registration"

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader><CardTitle>Register Voter</CardTitle></CardHeader>
        <CardContent>
          {electionState && electionState !== "Registration" && (
            <Alert variant="destructive" className="mb-6"><AlertDescription>Registration is closed. Current state: {electionState}.</AlertDescription></Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required pattern="^[A-Za-z ]{3,50}$" /></div>
              <div className="space-y-2"><Label htmlFor="nationalId">National ID</Label><Input id="nationalId" value={formData.nationalId} onChange={(event) => setFormData({ ...formData, nationalId: event.target.value.trim() })} required pattern="^\d{10}$" /></div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")} type="button">
                      <CalendarIcon className="mr-2 h-4 w-4" />{format(formData.dateOfBirth, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.dateOfBirth} onSelect={(date) => date && setFormData({ ...formData, dateOfBirth: date })} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} required pattern="^[A-Za-z ,.-]{2,100}$" /></div>
            </div>

            <FaceCapture nid={formData.nationalId} onCaptureComplete={(success) => setBiometricStatus((previous) => ({ ...previous, faceCaptured: success }))} />
            {biometricStatus.faceCaptured && (
              <Button type="button" variant="outline" onClick={handleTrainFace} disabled={biometricStatus.isTraining}>
                {biometricStatus.isTraining ? "Training Face..." : biometricStatus.faceTrainingProgress === 100 ? "Face Trained" : "Train Face"}
              </Button>
            )}
            <FingerprintCapture
              nid={formData.nationalId}
              isCaptured={biometricStatus.fingerprintCaptured}
              onCapture={() => setBiometricStatus((previous) => ({ ...previous, fingerprintCaptured: true }))}
              onRetake={() => setBiometricStatus((previous) => ({ ...previous, fingerprintCaptured: false }))}
            />

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="submit" disabled={isLoading || !registrationOpen || !isAdmin} className="w-full">
              {isLoading ? "Registering..." : "Register Voter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
