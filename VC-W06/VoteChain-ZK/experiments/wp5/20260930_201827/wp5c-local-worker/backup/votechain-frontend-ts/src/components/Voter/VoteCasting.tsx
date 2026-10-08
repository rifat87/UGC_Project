import { useCallback, useEffect, useState } from "react"
import { useContract } from "@/hooks/useContract"
import { useWallet } from "@/components/ui/wallet-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Vote, CheckCircle2, User, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { VerificationModal } from "@/components/Biometric/VerificationModal"
import { getPublicElectionData, type PublicCandidate, type PublicElectionData, type ZkVotePreparation } from "@/services/api"

export function VoteCasting() {
  const { isWalletChecked, isConnected, address } = useWallet()
  const { isInitialized, isAdmin, castVote, isLoading: contractLoading, error: contractError } = useContract()
  const { toast } = useToast()
  const [data, setData] = useState<PublicElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [votedCandidate, setVotedCandidate] = useState<PublicCandidate | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingCandidate, setPendingCandidate] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getPublicElectionData())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to fetch election data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleVote = (candidateId: number) => {
    if (!isConnected) {
      toast({ title: "Wallet Not Connected", description: "Connect the vote-submission wallet before voting.", variant: "destructive" })
      return
    }
    if (isAdmin) {
      toast({ title: "Admin wallet cannot use voter UI", description: "Use a non-admin vote-submission wallet.", variant: "destructive" })
      return
    }
    if (data?.electionState !== "Active") {
      toast({ title: "Voting unavailable", description: `Voting is only available while the election is Active. Current state: ${data?.electionState || "unknown"}.`, variant: "destructive" })
      return
    }
    setPendingCandidate(candidateId)
    setIsModalOpen(true)
  }

  const handleVerified = async (preparation: ZkVotePreparation) => {
    if (pendingCandidate === null || !data) return
    const candidateId = pendingCandidate
    const candidate = data.candidates.find((item) => item.candidateId === candidateId) || null

    try {
      setIsVoting(true)
      setSelectedCandidate(candidateId)
      if (preparation.candidateId !== candidateId) throw new Error("Prepared proof candidate does not match selected candidate")
      const receipt = await castVote(candidateId, preparation.proof)
      setVotedCandidate(candidate)
      setTransactionHash(receipt?.hash || null)
      toast({ title: "Vote Cast Successfully", description: `Vote for ${candidate?.name || `candidate #${candidateId}`} was recorded on-chain.` })
      await refresh()
    } catch (voteError) {
      console.error("Vote transaction failed", voteError)
      toast({ title: "Vote Failed", description: voteError instanceof Error ? voteError.message : "There was an error casting the vote.", variant: "destructive" })
    } finally {
      setIsVoting(false)
      setSelectedCandidate(null)
      setPendingCandidate(null)
      setIsModalOpen(false)
    }
  }

  const modal = (
    <VerificationModal open={isModalOpen} candidateId={pendingCandidate} onClose={() => { setIsModalOpen(false); setPendingCandidate(null) }} onVerified={handleVerified} />
  )

  if (!isWalletChecked || !isConnected || !isInitialized || loading || contractLoading) {
    return <>{modal}<div className="container mx-auto p-4 max-w-4xl"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Vote className="h-6 w-6" />Cast Your Vote</CardTitle></CardHeader><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card></div></>
  }

  if (error || contractError || !data) {
    return <>{modal}<div className="container mx-auto p-4 max-w-4xl"><Card><CardHeader><CardTitle>Cast Your Vote</CardTitle></CardHeader><CardContent className="text-center py-12"><AlertCircle className="h-8 w-8 mx-auto text-destructive" /><p className="text-destructive mt-3">{error || contractError?.message || "Election data unavailable"}</p><Button onClick={refresh} variant="outline" className="mt-4"><RefreshCw className="mr-2 h-4 w-4" />Try Again</Button></CardContent></Card></div></>
  }

  if (votedCandidate) {
    return <>{modal}<div className="container mx-auto p-4 max-w-2xl"><Card><CardHeader className="text-center"><div className="flex items-center justify-center gap-2 text-green-600 mb-2"><CheckCircle2 className="h-8 w-8" /><CardTitle className="text-2xl">Vote Recorded</CardTitle></div></CardHeader><CardContent className="text-center space-y-4"><p>Your vote for <strong>{votedCandidate.name}</strong> was recorded on the blockchain.</p>{transactionHash && <Badge variant="secondary" className="break-all">Transaction: {transactionHash}</Badge>}</CardContent></Card></div></>
  }

  const totalVotes = data.candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)
  const votingEnabled = data.electionState === "Active" && !isAdmin

  return (
    <>
      {modal}
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Vote className="h-6 w-6" />Cast Your Vote <Badge variant={data.electionState === "Active" ? "default" : "secondary"}>{data.electionState}</Badge></CardTitle></CardHeader>
          <CardContent><Alert><AlertDescription>{votingEnabled ? "Select a candidate. Biometric verification gates backend proof generation; the blockchain receives a Semaphore membership proof without exposing a persistent voter identifier." : "Voting is disabled unless the election is Active and a non-admin vote-submission wallet is connected."}</AlertDescription></Alert></CardContent>
        </Card>

        {data.candidates.length === 0 ? (
          <Card><CardContent className="flex items-center justify-center py-12"><div className="text-center space-y-4"><User className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-muted-foreground">No on-chain registered candidates with linked metadata were found.</p></div></CardContent></Card>
        ) : (
          <div className="grid gap-6">
            {data.candidates.map((candidate) => {
              const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0
              const isCurrentlyVoting = isVoting && selectedCandidate === candidate.candidateId
              return (
                <Card key={candidate.candidateId} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />{candidate.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">Candidate #{candidate.candidateId} · {candidate.party}</div>
                        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{candidate.location}</span></div>
                      </div>
                      <div className="text-right"><div className="text-2xl font-bold">{candidate.voteCount}</div><div className="text-sm text-muted-foreground">votes</div></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2"><div className="flex justify-between text-sm"><span>Current Support</span><span>{percentage.toFixed(1)}%</span></div><Progress value={percentage} className="h-2" /></div>
                    <Button onClick={() => handleVote(candidate.candidateId)} disabled={!votingEnabled || isVoting} className="w-full" size="lg">
                      {isCurrentlyVoting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing Vote...</> : <><Vote className="mr-2 h-4 w-4" />Vote for {candidate.name}</>}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <Card className="mt-6"><CardContent className="pt-6"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>Connected Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</span><span>Total Votes: {totalVotes}</span></div></CardContent></Card>
      </div>
    </>
  )
}
