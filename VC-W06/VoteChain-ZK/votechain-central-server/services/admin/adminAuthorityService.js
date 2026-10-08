
import {
  getAddress,
  isAddress,
} from "ethers"

import Election
  from "../../models/Election.js"

import {
  getRuntimeElection,
} from "../elections/electionRuntimeService.js"

import {
  getWp5Provider,
} from "../../utils/wp5Contract.js"

function authorityError(
  code,
  message,
) {
  const error =
    new Error(message)

  error.code =
    code

  return error
}

export async function
resolveAdminAuthority() {
  const provider =
    getWp5Provider()

  const network =
    await provider
      .getNetwork()

  const chainId =
    network.chainId
      .toString()

  const configured =
    String(
      process.env
        .ELECTION_COMMISSION_ADDRESS ||
      "",
    )
      .trim()

  if (configured) {
    if (!isAddress(configured)) {
      throw authorityError(
        "INVALID_ELECTION_COMMISSION_ADDRESS",
        "ELECTION_COMMISSION_ADDRESS is not a valid Ethereum address",
      )
    }

    return {
      admin:
        getAddress(
          configured,
        ),
      chainId,
      source:
        "environment",
    }
  }

  const current =
    await getRuntimeElection({
      statuses: [
        "registration",
        "starting",
        "active",
        "ended",
      ],

      lean:
        true,
    })

  if (
    current?.adminAddress &&
    isAddress(
      current.adminAddress,
    )
  ) {
    return {
      admin:
        getAddress(
          current.adminAddress,
        ),
      chainId,
      source:
        "current-election",
    }
  }

  /*
   * Local development fallback only.
   * This does not expose or print the Anvil key.
   */
  if (
    chainId === "31337" ||
    chainId === "1337"
  ) {
    const signer =
      await provider
        .getSigner(0)

    return {
      admin:
        getAddress(
          await signer
            .getAddress(),
        ),
      chainId,
      source:
        "local-rpc-signer-0",
    }
  }

  throw authorityError(
    "ELECTION_COMMISSION_ADDRESS_REQUIRED",
    "ELECTION_COMMISSION_ADDRESS must be configured on non-local networks",
  )
}
