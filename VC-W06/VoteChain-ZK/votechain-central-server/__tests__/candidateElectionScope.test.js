import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import {
  createCandidateWithModels,
  setCandidateRegistrationStatusWithModel,
} from "../services/candidateCore.js"

class FakeCounter {
  static seq = 0

  static async findOneAndUpdate(
    _filter,
    update,
  ) {
    if (update.$inc?.seq) {
      this.seq +=
        Number(
          update.$inc.seq,
        )
    }

    return {
      seq:
        this.seq,
    }
  }
}

class FakeCandidate {
  static records = []

  constructor(data) {
    Object.assign(
      this,
      data,
    )
  }

  async save() {
    this.constructor.records.push(
      this,
    )

    return this
  }

  static async findOne(filter) {
    return (
      this.records.find(
        candidate =>
          Object.entries(
            filter,
          ).every(
            ([key, value]) =>
              candidate[key] ===
              value,
          ),
      ) ||
      null
    )
  }

  static async findOneAndUpdate(
    filter,
    update,
  ) {
    const candidate =
      await this.findOne(
        filter,
      )

    if (!candidate) {
      return null
    }

    Object.assign(
      candidate,
      update.$set ||
      {},
    )

    return candidate
  }
}

function reset() {
  FakeCounter.seq =
    0

  FakeCandidate.records =
    []
}

const metadata = {
  nationalId:
    "1234567890",

  name:
    "Alice Example",

  party:
    "Example Party",

  location:
    "Dhaka",

  age:
    40,
}

test(
  "candidate is bound to server election scope and candidateId stays global",
  async () => {
    reset()

    const candidate =
      await createCandidateWithModels(
        {
          ...metadata,

          candidateId:
            999,

          electionId:
            "999",

          registrationStatus:
            "registered",
        },
        "100",
        {
          CandidateModel:
            FakeCandidate,

          CounterModel:
            FakeCounter,
        },
      )

    assert.equal(
      candidate.candidateId,
      1,
    )

    assert.equal(
      candidate.electionId,
      "100",
    )

    assert.equal(
      candidate.registrationStatus,
      "pending",
    )
  },
)

test(
  "same NID is blocked in same election and allowed in later election",
  async () => {
    reset()

    await createCandidateWithModels(
      metadata,
      "100",
      {
        CandidateModel:
          FakeCandidate,

        CounterModel:
          FakeCounter,
      },
    )

    await assert.rejects(
      () =>
        createCandidateWithModels(
          metadata,
          "100",
          {
            CandidateModel:
              FakeCandidate,

            CounterModel:
              FakeCounter,
          },
        ),
      error =>
        error.code ===
          "DUPLICATE_NID",
    )

    const later =
      await createCandidateWithModels(
        metadata,
        "101",
        {
          CandidateModel:
            FakeCandidate,

          CounterModel:
            FakeCounter,
        },
      )

    assert.equal(
      later.candidateId,
      2,
    )

    assert.equal(
      later.electionId,
      "101",
    )
  },
)

test(
  "candidate status mutation cannot cross elections",
  async () => {
    reset()

    const candidate =
      await createCandidateWithModels(
        metadata,
        "100",
        {
          CandidateModel:
            FakeCandidate,

          CounterModel:
            FakeCounter,
        },
      )

    await assert.rejects(
      () =>
        setCandidateRegistrationStatusWithModel(
          candidate.candidateId,
          "registered",
          "101",
          FakeCandidate,
        ),
      error =>
        error.code ===
          "NOT_FOUND",
    )

    const updated =
      await setCandidateRegistrationStatusWithModel(
        candidate.candidateId,
        "registered",
        "100",
        FakeCandidate,
      )

    assert.equal(
      updated.registrationStatus,
      "registered",
    )
  },
)

test(
  "Candidate schema has immutable electionId and no model-level global NID uniqueness",
  async () => {
    const source =
      await readFile(
        new URL(
          "../models/Candidate.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /electionId:\s*\{[\s\S]*?immutable:\s*true/,
    )

    const nationalId =
      source.match(
        /nationalId:\s*\{([\s\S]*?)\n\s*\},/,
      )?.[1] ||
      ""

    assert.doesNotMatch(
      nationalId,
      /unique:\s*true/,
    )

    assert.match(
      source,
      /candidateId_unique_valid/,
    )
  },
)

test(
  "candidate route uses candidate-specific election registration gate",
  async () => {
    const source =
      await readFile(
        new URL(
          "../routes/candidateRoutes.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /requireCandidateElectionRegistrationOpen/,
    )

    assert.doesNotMatch(
      source,
      /requireElectionRegistrationOpen/,
    )

    assert.match(
      source,
      /voteChainCandidateElection\.electionId/,
    )
  },
)

test(
  "candidate reconciliation loads candidate in current registration election",
  async () => {
    const source =
      await readFile(
        new URL(
          "../services/registration/registrationReceiptService.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /Candidate[\s\S]*?\.findOne\(\{[\s\S]*?candidateId:[\s\S]*?normalizedCandidateId,[\s\S]*?electionId:[\s\S]*?context\.election\.electionId/,
    )
  },
)

test(
  "snapshot candidate query is election scoped while manifest function remains",
  async () => {
    const source =
      await readFile(
        new URL(
          "../services/elections/electionSnapshotService.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /Candidate[\s\S]*?\.find\(\{[\s\S]*?electionId:[\s\S]*?election\.electionId/,
    )

    assert.match(
      source,
      /hashCandidateManifest\(/,
    )
  },
)

test(
  "active public candidate source uses frozen snapshot",
  async () => {
    const source =
      await readFile(
        new URL(
          "../controllers/electionController.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /election\?\.status[\s\S]*?"registration"/,
    )

    assert.match(
      source,
      /candidateSnapshot/,
    )
  },
)

test(
  "local election admin registration count is election scoped",
  async () => {
    const source =
      await readFile(
        new URL(
          "../scripts/local-election-admin.mjs",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /Candidate\.countDocuments\([\s\S]*?electionId:[\s\S]*?election\.electionId/,
    )
  },
)


test(
  "schema declares the election-scoped compound NID index",
  async () => {
    const source =
      await readFile(
        new URL(
          "../models/Candidate.js",
          import.meta.url,
        ),
        "utf8",
      )

    assert.match(
      source,
      /\{\s*electionId:\s*1,\s*nationalId:\s*1\s*\},\s*\{\s*unique:\s*true\s*,?\s*\}/,
    )

    const globalNationalIdIndex =
      /candidateSchema\.index\(\s*\{\s*nationalId:\s*1\s*\},\s*\{\s*unique:\s*true/

    assert.doesNotMatch(
      source,
      globalNationalIdIndex,
    )
  },
)
