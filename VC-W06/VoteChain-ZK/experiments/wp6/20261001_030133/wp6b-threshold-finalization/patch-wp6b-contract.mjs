import {
  readFile,
  writeFile,
} from "node:fs/promises"

const file =
  process.argv[2]

let text =
  await readFile(
    file,
    "utf8",
  )

text =
  text.replace(
    /\r\n/g,
    "\n",
  )

function insertBefore({
  marker,
  anchor,
  insertion,
  label,
}) {
  if (
    text.includes(
      marker,
    )
  ) {
    console.log(
      `${label}=ALREADY_PRESENT`,
    )

    return
  }

  const index =
    text.indexOf(
      anchor,
    )

  if (
    index < 0
  ) {
    throw new Error(
      `Cannot locate ${label} anchor`,
    )
  }

  text =
    text.slice(
      0,
      index,
    ) +
    insertion +
    text.slice(
      index,
    )

  console.log(
    `${label}=PATCHED`,
  )
}

if (
  !text.includes(
    "bytes32 public trusteeTranscriptHash;",
  )
) {
  const anchor =
`    uint256 public acceptedBallotCount;

`

  const index =
    text.indexOf(
      anchor,
    )

  if (
    index < 0
  ) {
    throw new Error(
      "Cannot locate acceptedBallotCount state anchor",
    )
  }

  const replacement =
`    uint256 public acceptedBallotCount;

    /*
     * WP6 threshold-finalization evidence.
     *
     * trusteeTranscriptHash is pinned during Registration.
     * finalizationTranscriptHash is written only after Ended.
     *
     * The full threshold transcript remains public/off-chain;
     * Solidity anchors its canonical SHA-256 hash and the
     * independently verified plaintext aggregate totals.
     */
    bytes32 public trusteeTranscriptHash;

    bytes32 public finalizationTranscriptHash;

    uint256[16] internal finalResults;

`

  text =
    text.slice(
      0,
      index,
    ) +
    replacement +
    text.slice(
      index +
      anchor.length,
    )

  console.log(
    "WP6B_CONTRACT_STATE=PATCHED",
  )
} else {
  console.log(
    "WP6B_CONTRACT_STATE=ALREADY_PRESENT",
  )
}

insertBefore({
  marker:
    "event TrusteeTranscriptPinned(",

  anchor:
`    event EncryptedVoteAccepted(
`,

  insertion:
`    event TrusteeTranscriptPinned(
        bytes32 indexed transcriptHash
    );

    event TallyFinalized(
        bytes32 indexed transcriptHash,
        uint256 acceptedBallotCount
    );

`,

  label:
    "WP6B_EVENTS",
})

insertBefore({
  marker:
    "function setTrusteeTranscriptHash(",

  anchor:
`    function activate()
`,

  insertion:
`    /*
     * Pin the public DKG ceremony transcript before Active.
     *
     * The transcript verifier independently checks that the
     * committed trustee public shares derive the configured Y.
     * Existing WP4/WP5 deployment flows remain ABI-compatible:
     * this is an additional registration-stage call.
     */
    function setTrusteeTranscriptHash(
        bytes32 transcriptHash
    )
        external
        onlyAdmin
        inPhase(
            Phase.Registration
        )
    {
        require(
            configured,
            "NOT_CONFIGURED"
        );

        require(
            transcriptHash !=
                bytes32(0),
            "ZERO_TRUSTEE_TRANSCRIPT"
        );

        require(
            trusteeTranscriptHash ==
                bytes32(0),
            "TRUSTEE_TRANSCRIPT_ALREADY_SET"
        );

        trusteeTranscriptHash =
            transcriptHash;

        emit TrusteeTranscriptPinned(
            transcriptHash
        );
    }

`,

  label:
    "WP6B_TRANSCRIPT_PIN",
})

insertBefore({
  marker:
    "function finalizeTally(",

  anchor:
`    function getTally(
`,

  insertion:
`    /*
     * WP6 prototype finalization boundary.
     *
     * Threshold/DLEQ verification is performed by the public
     * transcript verifier before this transaction is submitted.
     * This contract:
     *
     *   - requires Ended,
     *   - requires a registration-stage trustee transcript pin,
     *   - enforces candidate padding,
     *   - enforces sum(totals) == acceptedBallotCount,
     *   - anchors the independently verified transcript hash,
     *   - exposes plaintext totals only in Finalized.
     *
     * The transcript and proofs stay independently re-verifiable.
     */
    function finalizeTally(
        uint256[16] calldata totals,
        bytes32 transcriptHash
    )
        external
        onlyAdmin
        inPhase(
            Phase.Ended
        )
    {
        require(
            trusteeTranscriptHash !=
                bytes32(0),
            "TRUSTEE_TRANSCRIPT_NOT_PINNED"
        );

        require(
            transcriptHash !=
                bytes32(0),
            "ZERO_FINALIZATION_TRANSCRIPT"
        );

        uint256 activeSum;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            if (
                i <
                candidateCount
            ) {
                require(
                    totals[i] <=
                        acceptedBallotCount,
                    "RESULT_EXCEEDS_BALLOTS"
                );

                activeSum +=
                    totals[i];
            } else {
                require(
                    totals[i] == 0,
                    "NONZERO_PADDED_RESULT"
                );
            }

            finalResults[i] =
                totals[i];
        }

        require(
            activeSum ==
                acceptedBallotCount,
            "RESULT_SUM_MISMATCH"
        );

        finalizationTranscriptHash =
            transcriptHash;

        phase =
            Phase.Finalized;

        emit TallyFinalized(
            transcriptHash,
            acceptedBallotCount
        );
    }

    function getFinalResult(
        uint256 slot
    )
        external
        view
        returns (uint256)
    {
        require(
            phase ==
                Phase.Finalized,
            "NOT_FINALIZED"
        );

        require(
            slot <
                candidateCount,
            "BAD_FINAL_RESULT_SLOT"
        );

        return
            finalResults[slot];
    }

`,

  label:
    "WP6B_FINALIZATION_FUNCTIONS",
})

const required = [
  "bytes32 public trusteeTranscriptHash;",
  "bytes32 public finalizationTranscriptHash;",
  "function setTrusteeTranscriptHash(",
  "function finalizeTally(",
  "function getFinalResult(",
  "event TallyFinalized(",
]

for (
  const marker
  of required
) {
  if (
    !text.includes(
      marker,
    )
  ) {
    throw new Error(
      `WP6B contract marker missing: ${marker}`,
    )
  }
}

await writeFile(
  file,
  text,
  "utf8",
)

console.log(
  "WP6B_CONTRACT_PATCH=PASS",
)
