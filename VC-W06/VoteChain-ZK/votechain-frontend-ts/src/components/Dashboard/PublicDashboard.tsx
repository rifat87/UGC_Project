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
  getCurrentElectionLifecycle,
  getElectionResults,
  getPublicElectionData,
  type CurrentElectionLifecycle,
  type FinalizedElectionResults,
  type PublicElectionData,
} from "@/services/api"


function lifecycleLabel(
  status: CurrentElectionLifecycle["status"],
) {
  switch (status) {
    case "registration":
      return "Registration"

    case "starting":
      return "Starting"

    case "active":
      return "Active"

    case "ended":
      return "Ended"

    case "finalized":
      return "Finalized"

    case "orphaned":
      return "Orphaned"

    default:
      return "Failed"
  }
}


export function PublicDashboard() {
  const [
    lifecycle,
    setLifecycle,
  ] =
    useState<CurrentElectionLifecycle | null>(
      null,
    )

  const [
    metadata,
    setMetadata,
  ] =
    useState<PublicElectionData | null>(
      null,
    )

  const [
    finalized,
    setFinalized,
  ] =
    useState<FinalizedElectionResults | null>(
      null,
    )

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
    useState<string | null>(
      null,
    )


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
          /*
           * Authoritative election state comes from the dynamic
           * application lifecycle / VoteChainDirect election.
           */
          const current =
            await getCurrentElectionLifecycle()

          setLifecycle(
            current,
          )

          if (!current) {
            setMetadata(
              null,
            )

            setFinalized(
              null,
            )

            return
          }

          /*
           * Plaintext candidate totals are fetched only after the
           * election has been threshold-decrypted and finalized.
           */
          if (
            current.status ===
              "finalized"
          ) {
            const results =
              await getElectionResults(
                current.electionId,
              )

            setFinalized(
              results,
            )

            setMetadata(
              null,
            )

            return
          }

          setFinalized(
            null,
          )

          /*
           * Before finalization the legacy compatibility endpoint
           * is used only for candidate metadata.
           *
           * Its electionState and voteCount fields are deliberately
           * ignored.
           */
          try {
            const publicMetadata =
              await getPublicElectionData()

            setMetadata(
              publicMetadata,
            )
          } catch {
            setMetadata(
              null,
            )
          }
        } catch (
          requestError
        ) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "Could not fetch election data",
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
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Public Dashboard
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />

            <p className="text-muted-foreground mt-4">
              Loading election data...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }


  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Public Dashboard
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-destructive" />

            <p className="text-destructive mt-4">
              {error}
            </p>

            <Button
              variant="outline"
              onClick={
                refresh
              }
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }


  if (!lifecycle) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Public Dashboard
            </CardTitle>
          </CardHeader>

          <CardContent>
            No election is currently available.
          </CardContent>
        </Card>
      </div>
    )
  }


  const candidateCount =
    lifecycle.candidateCount ??
    finalized?.results.length ??
    metadata?.candidateCount ??
    0


  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Public Dashboard
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">
              Election State
            </span>

            <Badge
              variant={
                lifecycle.status ===
                  "active"
                  ? "default"
                  : "secondary"
              }
            >
              {
                lifecycleLabel(
                  lifecycle.status,
                )
              }
            </Badge>

            {
              lifecycle.status ===
                "finalized" &&
              (
                <Badge variant="secondary">
                  Threshold Verified
                </Badge>
              )
            }
          </div>

          <div className="text-sm space-y-1">
            <p>
              Election ID:{" "}
              <span className="font-mono break-all">
                {lifecycle.electionId}
              </span>
            </p>

            <p>
              Frozen candidates:{" "}
              <strong>
                {candidateCount}
              </strong>
            </p>

            {
              lifecycle
                .eligibleVoterCount !==
                  null &&
              (
                <p>
                  Frozen eligible voters:{" "}
                  <strong>
                    {
                      lifecycle
                        .eligibleVoterCount
                    }
                  </strong>
                </p>
              )
            }

            {
              lifecycle.status !==
                "registration" &&
              (
                <p>
                  Accepted encrypted ballots:{" "}
                  <strong>
                    {
                      lifecycle
                        .acceptedBallotCount
                    }
                  </strong>
                </p>
              )
            }
          </div>

          {
            lifecycle.status ===
              "active" &&
            (
              <p className="text-sm text-muted-foreground">
                Voting is active. Candidate-specific totals remain encrypted and are not published during voting.
              </p>
            )
          }

          {
            lifecycle.status ===
              "ended" &&
            (
              <p className="text-sm text-muted-foreground">
                Voting has ended. The encrypted aggregate is frozen while the WP6 threshold-decryption transcript is prepared and verified.
              </p>
            )
          }

          {
            lifecycle.status ===
              "finalized" &&
            (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />

                  <p>
                    Final candidate totals were released only after
                    threshold decryption, DLEQ verification, WP6
                    transcript verification, and on-chain finalization.
                  </p>
                </div>

                {
                  lifecycle
                    .finalizationTranscriptHash &&
                  (
                    <p className="text-xs text-muted-foreground">
                      Finalization transcript:{" "}
                      <span className="font-mono break-all">
                        {
                          lifecycle
                            .finalizationTranscriptHash
                        }
                      </span>
                    </p>
                  )
                }

                <Button
                  onClick={() =>
                    window.location.assign(
                      "/results",
                    )
                  }
                >
                  View Public Finalized Results
                </Button>
              </div>
            )
          }
        </CardContent>
      </Card>


      {
        finalized &&
        (
          <div className="grid gap-4">
            {
              finalized.results.map(
                result => {
                  const accepted =
                    Number(
                      finalized
                        .acceptedBallotCount,
                    )

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
        )
      }


      {
        !finalized &&
        metadata &&
        (
          <Card>
            <CardHeader>
              <CardTitle>
                Candidates
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {
                metadata.candidates.map(
                  candidate => (
                    <div
                      key={
                        candidate.candidateId
                      }
                      className="rounded-md border p-4"
                    >
                      <p className="font-medium">
                        {
                          candidate.name
                        }
                      </p>

                      <p className="text-sm text-muted-foreground">
                        Candidate #
                        {
                          candidate.candidateId
                        }
                        {" · "}
                        {
                          candidate.party
                        }
                        {" · "}
                        {
                          candidate.location
                        }
                      </p>
                    </div>
                  ),
                )
              }

              <p className="text-xs text-muted-foreground">
                Candidate-specific plaintext vote totals are unavailable until the election reaches Finalized.
              </p>
            </CardContent>
          </Card>
        )
      }
    </div>
  )
}
