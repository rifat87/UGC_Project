import {
  BrowserProvider,
  getAddress,
} from "ethers"

import {
  apiUrl,
} from "@/config/api"

const ADMIN_AUTH_SCHEME =
  "VoteChainAdminV2"

function normalizeJson(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJson)
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    const record =
      value as Record<string, unknown>

    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [
          key,
          normalizeJson(
            record[key],
          ),
        ]),
    )
  }

  return value
}

function canonicalJson(
  value: unknown,
): string {
  return JSON.stringify(
    normalizeJson(
      value === undefined
        ? null
        : value,
    ),
  )
}

async function sha256Hex(
  text: string,
): Promise<string> {
  const bytes =
    new TextEncoder()
      .encode(text)

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    )

  return Array.from(
    new Uint8Array(digest),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
}

function parseJsonBody(
  body: BodyInit | null | undefined,
): unknown {
  if (
    body === undefined ||
    body === null ||
    body === ""
  ) {
    return null
  }

  if (typeof body !== "string") {
    throw new Error(
      "Administrator API mutations must use a JSON string body",
    )
  }

  try {
    return JSON.parse(body)
  } catch {
    throw new Error(
      "Administrator API mutation body must be valid JSON",
    )
  }
}

export async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const ethereum =
    (
      window as unknown as {
        ethereum?: unknown
      }
    ).ethereum

  if (!ethereum) {
    throw new Error(
      "An injected wallet is required for administrator API mutations",
    )
  }

  const provider =
    new BrowserProvider(
      ethereum as never,
    )

  const signer =
    await provider.getSigner()

  const address =
    getAddress(
      await signer.getAddress(),
    )

  const method =
    (
      init.method ||
      "GET"
    ).toUpperCase()

  const bodyHash =
    await sha256Hex(
      canonicalJson(
        parseJsonBody(
          init.body,
        ),
      ),
    )

  /*
   * Server creates issuedAt/expiresAt/challengeId.
   * Browser time is not an authentication authority.
   */
  const challengeResponse =
    await fetch(
      apiUrl(
        "/api/admin-auth/challenge",
      ),
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            address,
            method,
            path,
            bodyHash,
          }),
      },
    )

  const challengePayload =
    await challengeResponse.json()

  if (
    !challengeResponse.ok ||
    !challengePayload.success ||
    !challengePayload.data
  ) {
    throw new Error(
      challengePayload.message ||
      "Unable to obtain administrator challenge",
    )
  }

  const challengeId =
    String(
      challengePayload
        .data
        .challengeId,
    )

  const message =
    String(
      challengePayload
        .data
        .message,
    )

  const signature =
    await signer.signMessage(
      message,
    )

  const headers =
    new Headers(
      init.headers,
    )

  headers.set(
    "Authorization",
    `${ADMIN_AUTH_SCHEME} ${challengeId}.${signature}`,
  )

  return fetch(
    apiUrl(path),
    {
      ...init,
      method,
      headers,
    },
  )
}
