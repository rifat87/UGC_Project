import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Button,
} from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Progress,
} from "@/components/ui/progress"

import {
  getLatestFinalizedElectionResults,
  type FinalizedElectionResults,
} from "@/services/api"


export default function FinalizedResultsPage() {
  const [
    data,
    setData,
  ] =
    useState<
      FinalizedElectionResults |
      null
    >(null)

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    )

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(null)


  const refresh =
    useCallback(
      async () => {
        setLoading(
          true,
        )

        setError(
          null,
        )

        try {
          setData(
            await getLatestFinalizedElectionResults(),
          )
        } catch (
          requestError
        ) {
          setData(
            null,
          )

          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "Finalized results are unavailable",
          )
        } finally {
          setLoading(
            false,
          )
        }
      },
      [],
    )


  useEffect(
    () => {
      void refresh()
    },
    [
      refresh,
    ],
  )


  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }


  if (
    error ||
    !data
  ) {
    return (
      <div className="container mx-auto max-w-4xl p-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />

            <p className="mt-3 text-destructive">
              {
                error ||
                "No finalized election result is available."
              }
            </p>

            <Button
              variant="outline"
              className="mt-4"
              onClick={
                refresh
              }
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }


  const accepted =
    Number(
      data.acceptedBallotCount,
    )


  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Final Election Results

            <Badge variant="secondary">
              Threshold Verified
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm">
          <p>
            Election ID:{" "}
            <span className="font-mono break-all">
              {data.electionId}
            </span>
          </p>

          <p>
            Accepted encrypted ballots:{" "}
            <strong>
              {
                data.acceptedBallotCount
              }
            </strong>
          </p>

          <p>
            Finalized:{" "}
            {
              data.finalizedAt
                ? new Date(
                    data.finalizedAt,
                  )
                    .toLocaleString()
                : "Recorded"
            }
          </p>

          <p>
            WP6 finalization transcript:{" "}
            <span className="font-mono break-all">
              {
                data.finalizationTranscriptHash
              }
            </span>
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {
          data.results.map(
            result => {
              const votes =
                Number(
                  result.votes,
                )

              const percentage =
                accepted > 0
                  ? (
                      votes /
                      accepted
                    ) * 100
                  : 0

              return (
                <Card
                  key={
                    result.slot
                  }
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-4">
                      <span>
                        {
                          result.name
                        }
                      </span>

                      <Badge variant="secondary">
                        {
                          result.votes
                        }{" "}
                        vote
                        {
                          result.votes ===
                            "1"
                            ? ""
                            : "s"
                        }
                      </Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Candidate #
                      {
                        result.candidateId
                      }
                      {" · "}
                      {
                        result.party
                      }
                      {" · "}
                      {
                        result.location
                      }
                    </p>

                    <Progress
                      value={
                        percentage
                      }
                    />

                    <p className="text-sm text-right">
                      {
                        percentage.toFixed(
                          1,
                        )
                      }
                      %
                    </p>
                  </CardContent>
                </Card>
              )
            },
          )
        }
      </div>
    </div>
  )
}
