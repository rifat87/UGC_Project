import {
  useCallback,
  useEffect,
  useState,
} from "react"
import {
  useContract,
} from "@/hooks/useContract"
import {
  useWallet,
} from "@/components/ui/wallet-provider"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Button,
} from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import {
  Badge,
} from "@/components/ui/badge"
import {
  useToast,
} from "@/hooks/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  User,
  Vote,
} from "lucide-react"
import {
  VerificationModal,
} from "@/components/Biometric/VerificationModal"
import {
  getWp5PublicConfig,
  type Wp5Authorization,
  type Wp5Candidate,
  type Wp5PublicConfig,
} from "@/services/api"
import {
  prepareWp5EncryptedBallot,
  resetWp5PrivacySession,
} from "@/privacy/wp5PrivacyClient"

const PHASE_LABELS:
  Record<number, string> = {
    0: "Registration",
    1: "Active",
    2: "Ended",
    3: "Finalized",
  }

export function VoteCasting() {
  const {
    isWalletChecked,
    isConnected,
    address,
  } =
    useWallet()

  const {
    isAdmin,
    castEncryptedVote,
  } =
    useContract()

  const {
    toast,
  } =
    useToast()

  const [
    data,
    setData,
  ] =
    useState<Wp5PublicConfig | null>(
      null,
    )

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    selectedCandidate,
    setSelectedCandidate,
  ] =
    useState<number | null>(
      null,
    )

  const [
    pendingCandidate,
    setPendingCandidate,
  ] =
    useState<number | null>(
      null,
    )

  const [
    votedCandidate,
    setVotedCandidate,
  ] =
    useState<Wp5Candidate | null>(
      null,
    )

  const [
    transactionHash,
    setTransactionHash,
  ] =
    useState<string | null>(
      null,
    )

  const [
    isVoting,
    setIsVoting,
  ] =
    useState(false)

  const [
    isModalOpen,
    setIsModalOpen,
  ] =
    useState(false)

  const refresh =
    useCallback(
      async () => {
        setLoading(true)
        setError(null)

        try {
          setData(
            await getWp5PublicConfig(),
          )
        } catch (
          requestError
        ) {
          setError(
            requestError
              instanceof Error
              ? requestError.message
              : "Failed to fetch VoteChain-ZK election configuration",
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(
    () => {
      return () => {
        resetWp5PrivacySession()
      }
    },
    [],
  )

  const closeModal =
    () => {
      if (isVoting) {
        return
      }

      resetWp5PrivacySession()
      setIsModalOpen(false)
      setPendingCandidate(null)
      setSelectedCandidate(null)
    }

  const handleVote =
    (
      candidateId:
        number,
    ) => {
      if (!isConnected) {
        toast({
          title:
            "Wallet Not Connected",
          description:
            "Connect the government-funded vote-submission wallet before voting.",
          variant:
            "destructive",
        })

        return
      }

      if (isAdmin) {
        toast({
          title:
            "Election admin wallet cannot use voter UI",
          description:
            "Use the designated non-admin vote-submission wallet.",
          variant:
            "destructive",
        })

        return
      }

      if (
        !data ||
        !data.configured ||
        data.phase !== 1
      ) {
        toast({
          title:
            "Voting unavailable",
          description:
            `Voting requires an active configured VoteChain-ZK election. Current phase: ${
              PHASE_LABELS[
                data?.phase ??
                -1
              ] ??
              "unknown"
            }.`,
          variant:
            "destructive",
        })

        return
      }

      /*
       * The selected candidate remains local.
       * VerificationModal never receives it.
       */
      setPendingCandidate(
        candidateId,
      )

      setIsModalOpen(
        true,
      )
    }

  const handleVerified =
    async (
      authorization:
        Wp5Authorization,
    ) => {
      if (
        pendingCandidate ===
          null ||
        !data
      ) {
        throw new Error(
          "Local candidate selection is unavailable",
        )
      }

      const candidateId =
        pendingCandidate

      const candidate =
        data.candidates.find(
          item =>
            item.candidateId ===
            candidateId,
        ) ?? null

      try {
        setIsVoting(true)
        setSelectedCandidate(
          candidateId,
        )

        /*
         * Candidate plaintext enters only the isolated
         * local privacy worker here.
         */
        const ballot =
          await prepareWp5EncryptedBallot(
            candidateId,
            authorization,
            data,
          )

        /*
         * The wallet receives only proof, nullifier and
         * ciphertext coordinates.
         */
        const receipt =
          await castEncryptedVote(
            ballot,
          )

        setVotedCandidate(
          candidate,
        )

        setTransactionHash(
          receipt?.hash ??
          null,
        )

        toast({
          title:
            "Encrypted Vote Accepted",
          description:
            "The privacy-preserving ballot was recorded on-chain.",
        })

        setIsModalOpen(false)
        setPendingCandidate(null)

        await refresh()
      } catch (
        voteError
      ) {
        console.error(
          "Private vote transaction failed",
          voteError,
        )

        toast({
          title:
            "Vote Failed",
          description:
            voteError
              instanceof Error
              ? voteError.message
              : "There was an error preparing or submitting the encrypted ballot.",
          variant:
            "destructive",
        })

        throw voteError
      } finally {
        setIsVoting(false)
        setSelectedCandidate(null)

        /*
         * Terminates the worker and destroys the
         * ephemeral credential-release key reference.
         */
        resetWp5PrivacySession()
      }
    }

  const modal = (
    <VerificationModal
      open={
        isModalOpen
      }
      onClose={
        closeModal
      }
      onVerified={
        handleVerified
      }
    />
  )

  if (
    !isWalletChecked ||
    !isConnected ||
    loading
  ) {
    return (
      <>
        {modal}

        <div className="container mx-auto p-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-6 w-6" />
                Cast Your Vote
              </CardTitle>
            </CardHeader>

            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (
    error ||
    !data
  ) {
    return (
      <>
        {modal}

        <div className="container mx-auto p-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>
                Cast Your Vote
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center py-12">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive" />

              <p className="text-destructive mt-3">
                {error ||
                  "VoteChain-ZK election data unavailable"}
              </p>

              <Button
                onClick={
                  refresh
                }
                variant="outline"
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (
    votedCandidate
  ) {
    return (
      <>
        {modal}

        <div className="container mx-auto p-4 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-8 w-8" />

                <CardTitle className="text-2xl">
                  Encrypted Vote Recorded
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p>
                Your locally selected vote for{" "}
                <strong>
                  {votedCandidate.name}
                </strong>{" "}
                was submitted as an encrypted ballot.
              </p>

              {transactionHash && (
                <Badge
                  variant="secondary"
                  className="break-all"
                >
                  Transaction:{" "}
                  {transactionHash}
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const phaseLabel =
    PHASE_LABELS[
      data.phase
    ] ??
    "Unknown"

  const votingEnabled =
    data.configured &&
    data.phase === 1 &&
    !isAdmin

  return (
    <>
      {modal}

      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-6 w-6" />

              Cast Your Vote

              <Badge
                variant={
                  data.phase === 1
                    ? "default"
                    : "secondary"
                }
              >
                {phaseLabel}
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Alert>
              <ShieldCheck className="h-4 w-4" />

              <AlertDescription>
                Candidate selection remains on this terminal.
                Biometric services receive no selected candidate.
                The local privacy worker creates the one-hot ballot,
                BabyJub ciphertexts and DIRECT Groth16 proof before
                the wallet submits the encrypted transaction.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {data.candidates.length === 0
          ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <User className="h-8 w-8 mx-auto text-muted-foreground" />

                  <p className="text-muted-foreground">
                    No registered candidates were found in the
                    frozen election manifest.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
          : (
            <div className="grid gap-6">
              {data.candidates.map(
                candidate => {
                  const isCurrentlyVoting =
                    isVoting &&
                    selectedCandidate ===
                      candidate.candidateId

                  return (
                    <Card
                      key={
                        candidate.candidateId
                      }
                      className="transition-all hover:shadow-md"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              {candidate.name}
                            </CardTitle>

                            <div className="text-sm text-muted-foreground">
                              Candidate #
                              {candidate.candidateId}
                              {" · "}
                              {candidate.party}
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {candidate.location}
                              </span>
                            </div>
                          </div>

                          <Badge variant="outline">
                            Encrypted tally
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <Button
                          onClick={() =>
                            handleVote(
                              candidate.candidateId,
                            )
                          }
                          disabled={
                            !votingEnabled ||
                            isVoting
                          }
                          className="w-full"
                          size="lg"
                        >
                          {isCurrentlyVoting
                            ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Preparing Private Vote...
                              </>
                            )
                            : (
                              <>
                                <Vote className="mr-2 h-4 w-4" />
                                Vote for{" "}
                                {candidate.name}
                              </>
                            )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                },
              )}
            </div>
          )}

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Submission Wallet:{" "}
                {address?.slice(0, 6)}
                ...
                {address?.slice(-4)}
              </span>

              <span>
                Accepted encrypted ballots:{" "}
                {data.acceptedBallotCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
