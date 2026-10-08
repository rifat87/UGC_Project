import { useCallback, useEffect, useState } from "react"
import { useWallet } from "@/components/ui/wallet-provider"
import { CandidateList } from "@/components/Dashboard/CandidateList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getPublicElectionData, type PublicElectionData } from "@/services/api"

export function VoterDashboard() {
  const { isWalletChecked, isConnected } = useWallet()
  const [data, setData] = useState<PublicElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getPublicElectionData())
    } catch (requestError) {
      console.error("Failed to fetch voter dashboard data", requestError)
      setError(requestError instanceof Error ? requestError.message : "Could not fetch candidate data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isWalletChecked && isConnected) void fetchCandidates()
  }, [isWalletChecked, isConnected, fetchCandidates])

  if (!isWalletChecked || !isConnected) {
    return <div className="flex h-screen items-center justify-center"><span className="text-muted-foreground">Checking wallet...</span></div>
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Loading candidates...</span></div>
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-destructive mt-2">{error || "Election data unavailable"}</p>
        <Button variant="outline" onClick={fetchCandidates} className="mt-4"><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Voter Dashboard</CardTitle>
          <Badge variant={data.electionState === "Active" ? "default" : "secondary"}>{data.electionState}</Badge>
        </CardHeader>
        <CardContent>
          <CandidateList candidates={data.candidates} isLoading={false} />
        </CardContent>
      </Card>
    </div>
  )
}
