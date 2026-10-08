import { useCallback, useEffect, useState } from "react"
import { CandidateList } from "@/components/Dashboard/CandidateList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { useContract } from "@/hooks/useContract"
import { getPublicElectionData, type PublicElectionData } from "@/services/api"
import { Badge } from "@/components/ui/badge"

export function AdminDashboard() {
  const navigate = useNavigate()
  const { isAdmin, isInitialized, isLoading: contractLoading, error: contractError } = useContract()
  const [data, setData] = useState<PublicElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading || contractLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin mr-2" />Loading election data...</div>
  }

  if (error || contractError || !data) {
    return <div className="flex items-center justify-center py-8 space-x-2 text-destructive"><AlertCircle className="h-6 w-6" /><span>{error || contractError?.message || "Election data unavailable"}</span><Button onClick={refresh} variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button></div>
  }

  if (isInitialized && !isAdmin) {
    return <div className="container mx-auto p-6"><Card><CardContent className="py-8 text-destructive">This dashboard requires the Election Commission wallet.</CardContent></Card></div>
  }

  const registrationOpen = data.electionState === "Registration"

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Admin Dashboard</CardTitle>
          <div className="flex items-center gap-2"><Badge variant={data.electionState === "Active" ? "default" : "secondary"}>{data.electionState}</Badge><Button onClick={refresh} variant="outline" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {registrationOpen && <Button onClick={() => navigate("/admin/register-voter")}>Register Voter</Button>}
            {registrationOpen && <Button onClick={() => navigate("/admin/register-candidate")}>Register Candidate</Button>}
            <Button variant="outline" onClick={() => navigate("/admin/status")}>Election Lifecycle</Button>
          </div>
          {!registrationOpen && <p className="text-sm text-muted-foreground">Registration controls are disabled after the election leaves Registration state.</p>}
          <CandidateList candidates={data.candidates} isLoading={false} />
        </CardContent>
      </Card>
    </div>
  )
}
