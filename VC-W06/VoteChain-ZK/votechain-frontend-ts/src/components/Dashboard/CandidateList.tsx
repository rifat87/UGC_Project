import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { PublicCandidate } from "@/services/api"

interface CandidateListProps {
  candidates: PublicCandidate[]
  onVote?: (candidateId: number) => void
  isLoading: boolean
  votingEnabled?: boolean
}

export function CandidateList({ candidates, onVote, isLoading, votingEnabled = true }: CandidateListProps) {
  if (isLoading) return <div>Loading candidates...</div>

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)

  return (
    <div className="grid gap-4">
      {candidates.map((candidate) => {
        const percentage = totalVotes > 0 ? (candidate.voteCount / totalVotes) * 100 : 0

        return (
          <Card key={candidate.candidateId}>
            <CardHeader>
              <CardTitle>{candidate.name}</CardTitle>
              <CardDescription>
                Candidate #{candidate.candidateId} · {candidate.party} · {candidate.location}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Votes: {candidate.voteCount}</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={percentage} />
                </div>
                {onVote && (
                  <Button
                    onClick={() => onVote(candidate.candidateId)}
                    className="w-full"
                    disabled={!votingEnabled}
                  >
                    Vote
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
