import {
  readFile,
} from "node:fs/promises"

const abi =
  JSON.parse(
    await readFile(
      new URL(
        "../src/abi/VoteChainDirect.json",
        import.meta.url,
      ),
      "utf8",
    ),
  )

const functions =
  abi.filter(
    item =>
      item?.type ===
        "function" &&
      (
        item.name ===
          "castVote" ||
        item.name ===
          "castEncryptedVote" ||
        item.name ===
          "usedNullifier"
      ),
  )

console.log(
  JSON.stringify(
    functions,
    null,
    2,
  ),
)
