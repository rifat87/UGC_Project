import { useEffect, useState } from "react"
import { useContract } from "@/hooks/useContract"
import { useWallet } from "@/components/ui/wallet-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  createCandidateMetadata,
  reconcileCandidateRegistration,
  type ElectionState,
} from "@/services/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormData {
  name: string
  party: string
  nationalId: string
  age: number
  location: string
}

export function RegisterCandidate() {
  const navigate = useNavigate()
  const { registerCandidate, getElectionState, isAdmin, isInitialized } = useContract()
  const { address } = useWallet()
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({ name: "", party: "", nationalId: "", age: 18, location: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [electionState, setElectionState] = useState<ElectionState | null>(null)

  useEffect(() => {
    if (isInitialized) {
      void getElectionState().then(setElectionState).catch(() => setElectionState(null))
    }
  }, [isInitialized, getElectionState])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!address || !isAdmin) {
      toast({ title: "Error", description: "Only the Election Commission wallet can register candidates", variant: "destructive" })
      return
    }

    const currentState = await getElectionState()
    setElectionState(currentState)
    if (currentState !== "Registration") {
      toast({ title: "Registration closed", description: `Candidate registration is unavailable while the election is ${currentState}.`, variant: "destructive" })
      return
    }

    setIsLoading(true)
    let candidateId: number | null = null
    let chainRegistered = false

    try {
      const candidate = await createCandidateMetadata(formData)
      candidateId = candidate.candidateId

      const receipt =
        await registerCandidate(
          candidate.candidateId,
        )

      chainRegistered =
        true

      if (!receipt?.hash) {
        throw new Error(
          "Candidate registration transaction receipt did not include a transaction hash",
        )
      }

      await reconcileCandidateRegistration(
        candidate.candidateId,
        receipt.hash,
      )
      toast({ title: "Success", description: `Candidate #${candidate.candidateId} registered on-chain successfully.` })
      navigate("/admin")
    } catch (registrationError) {
      console.error("Candidate registration error", registrationError)
      const message = chainRegistered && candidateId
        ? `Candidate #${candidateId} exists on-chain, but the database status could not be synchronized. Reconciliation is required.`
        : registrationError instanceof Error ? registrationError.message : "Failed to register candidate"
      toast({ title: "Registration failed", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const registrationOpen = electionState === null || electionState === "Registration"

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader><CardTitle>Register Candidate</CardTitle></CardHeader>
        <CardContent>
          {electionState && electionState !== "Registration" && (
            <Alert variant="destructive" className="mb-6"><AlertDescription>Registration is closed. Current state: {electionState}.</AlertDescription></Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required pattern="^[A-Za-z ]{3,50}$" /></div>
              <div className="space-y-2"><Label htmlFor="party">Party</Label><Input id="party" value={formData.party} onChange={(event) => setFormData({ ...formData, party: event.target.value })} required pattern="^[A-Za-z ]{2,40}$" /></div>
              <div className="space-y-2"><Label htmlFor="nationalId">National ID</Label><Input id="nationalId" value={formData.nationalId} onChange={(event) => setFormData({ ...formData, nationalId: event.target.value.trim() })} required pattern="^\d{10}$" title="National ID must be exactly 10 digits" /></div>
              <div className="space-y-2"><Label htmlFor="age">Age</Label><Input id="age" type="number" value={formData.age} onChange={(event) => setFormData({ ...formData, age: Number(event.target.value) })} required min={18} max={120} /></div>
              <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} required pattern="^[A-Za-z ,.-]{2,100}$" /></div>
            </div>
            <Button type="submit" disabled={isLoading || !registrationOpen || !isAdmin} className="w-full">
              {isLoading ? "Registering..." : "Register Candidate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
