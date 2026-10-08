import fs from "node:fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  JsonRpcProvider,
  Wallet,
  Contract
} from "ethers";
import { buildBabyjub } from "circomlibjs";

import Voter from "./models/Voter.js";

import {
  buildWp5MerkleSnapshot,
  getRegisteredWp5Candidates,
  hashCandidateManifest,
  wp5Hash
} from "./services/zk/wp5PrivacyService.js";

dotenv.config();

const profile = JSON.parse(
  fs.readFileSync(
    "../crypto/config/wp3-build-profile.json",
    "utf8"
  )
);

if (!process.env.DEPLOYER_PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY is missing");
}

if (!process.env.RPC_URL) {
  throw new Error("RPC_URL is missing");
}

if (!process.env.WP5_CONTRACT_ADDRESS) {
  throw new Error("WP5_CONTRACT_ADDRESS is missing");
}

await mongoose.connect(process.env.MONGO_URI);

try {
  const voters = await Voter.find({
    wp5RegistrationStatus: "registered",
    wp5IdentityCommitment: { $type: "string" },
    wp5GroupIndex: { $type: "number" }
  })
    .sort({ wp5GroupIndex: 1 })
    .select({
      wp5IdentityCommitment: 1,
      wp5GroupIndex: 1
    })
    .lean();

  if (voters.length === 0) {
    throw new Error("No registered WP5 voters");
  }

  const snapshot =
    await buildWp5MerkleSnapshot(voters);

  const eligibleRoot =
    BigInt(snapshot.root);

  const candidates =
    await getRegisteredWp5Candidates();

  if (candidates.length === 0) {
    throw new Error("No registered candidates");
  }

  const candidateIds =
    candidates.map(
      candidate => candidate.candidateId
    );

  const manifest =
    await hashCandidateManifest(candidateIds);

  const candidateCount =
    BigInt(candidateIds.length);

  // Local Anvil demo election
  const electionId = 1n;

  const contractDomain =
    BigInt(profile.testContractDomain);

  // Existing local/dev WP5 encryption key used by the repo runtime.
  const electionSecretKey =
    123456789n;

  const babyjub =
    await buildBabyjub();

  const Y =
    babyjub.mulPointEscalar(
      babyjub.Base8,
      electionSecretKey
    );

  const Yx =
    BigInt(
      babyjub.F.toObject(Y[0])
    );

  const Yy =
    BigInt(
      babyjub.F.toObject(Y[1])
    );

  const electionContextHash =
    await wp5Hash([
      BigInt(profile.domains.electionContext),
      electionId,
      manifest,
      candidateCount,
      contractDomain,
      Yx,
      Yy
    ]);

  const abi = JSON.parse(
    fs.readFileSync(
      "./abi/VoteChainDirect.json",
      "utf8"
    )
  );

  const provider =
    new JsonRpcProvider(
      process.env.RPC_URL
    );

  const signer =
    new Wallet(
      process.env.DEPLOYER_PRIVATE_KEY,
      provider
    );

  const direct =
    new Contract(
      process.env.WP5_CONTRACT_ADDRESS,
      abi,
      signer
    );

  const chainAdmin =
    String(await direct.admin()).toLowerCase();

  const signerAddress =
    String(await signer.getAddress()).toLowerCase();

  if (chainAdmin !== signerAddress) {
    throw new Error(
      "Configured signer is not VoteChainDirect admin"
    );
  }

  if (await direct.configured()) {
    throw new Error(
      "VoteChainDirect is already configured"
    );
  }

  console.log("WP5 voters       =", voters.length);
  console.log("Candidates       =", candidates.length);
  console.log("Candidate IDs    =", candidateIds.join(","));

  console.log("Configuring VoteChainDirect...");

  const configureTx =
    await direct.configure([
      eligibleRoot,
      electionId,
      manifest,
      candidateCount,
      contractDomain,
      Yx,
      Yy,
      electionContextHash
    ]);

  await configureTx.wait();

  console.log("CONFIGURE_TX      =", configureTx.hash);

  console.log("Activating VoteChainDirect...");

  const activateTx =
    await direct.activate();

  await activateTx.wait();

  console.log("ACTIVATE_TX       =", activateTx.hash);

  console.log(
    "configured        =",
    await direct.configured()
  );

  console.log(
    "phase             =",
    Number(await direct.phase())
  );

  console.log(
    "eligibleRootMatch =",
    BigInt(await direct.eligibleRoot()) === eligibleRoot
  );

  console.log(
    "manifestMatch     =",
    BigInt(await direct.candidateManifestHash()) === manifest
  );

  console.log(
    "candidateCount    =",
    Number(await direct.candidateCount())
  );

  console.log(
    "DIRECT_CONFIGURATION_COMPLETE=YES"
  );
} finally {
  await mongoose.disconnect();
}
