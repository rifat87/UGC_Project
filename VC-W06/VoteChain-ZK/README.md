# Blockchain-Integrated IoT Biometric Architecture for Secure and Decentralized Electronic Voting

Blockchain-Integrated IoT Biometric Architecture for Secure and
Decentralized Electronic Voting is a blockchain-based electronic voting prototype that integrates Ethereum smart contracts, IoT-enabled biometric authentication, and a React/TypeScript dApp to support secure voter registration, biometric verification, vote casting, and public result viewing.

This repository contains the revised engineering system implementation prepared for academic peer review.

---

## Previous Development Repository

Earlier development history and experimental versions can be found here:

https://github.com/rifat87/VoteChain

---

## System Overview

It combines the following layers:

- Ethereum smart contract for candidate registration, voter-hash registration, vote casting, duplicate-vote prevention, and result tallying
- React + TypeScript frontend for admin, voter, and public dashboards
- Node.js/Express backend for voter/candidate records, biometric API coordination, and pseudonymous voter-hash generation
- MongoDB for off-chain voter/candidate records
- Face recognition module for face capture, model training, and verification
- Fingerprint authentication module using ESP32/R307-based biometric interaction
- MetaMask and Anvil for local blockchain testing

The system follows a hybrid design: sensitive identity and biometric information remain off-chain, while the blockchain stores voting-state data and a pseudonymous voter hash.

---

## User Roles

### Admin / Election Commission

The admin can:

- Register candidates
- Register voters
- Capture and train biometric data
- Register voter-hash commitments on-chain
- End the election
- Monitor election status

### Voter

The voter can:

- Authenticate using face or fingerprint verification
- Select a candidate
- Cast a vote after successful biometric verification
- Have the vote recorded through the smart contract

### Public / Observer

The public can:

- View candidate list
- View real-time vote counts
- View election status and final results

---

## Privacy-Preserving Voter Identity Flow

The revised system avoids sending the raw voter National ID directly to the blockchain.

During voter registration:

```text
NID + voter details
        ↓
Backend generates random salt
        ↓
Backend encrypts salt using secret key
        ↓
Backend computes voterHash = Hash(NID || salt)
        ↓
MongoDB stores NID, encryptedSalt, voterHash, and voter profile
        ↓
Blockchain stores voterHash as bytes32
```

## During vote casting:

```text
Biometric verification succeeds
        ↓
Backend identifies voter internally
        ↓
Backend retrieves or recomputes voterHash
        ↓
Frontend calls smart contract:
castVote(candidateNID, voterHash)
        ↓
Smart contract checks:
- voterHash is registered
- voterHash has not voted before
- candidateNID is valid
```

This provides pseudonymity, not full anonymity. The blockchain no longer stores raw voter NID as the voting identifier, but stronger anonymity mechanisms such as anonymous credentials, encrypted ballots, or zero-knowledge proofs are future work.

---


## Technologies Used

**Blockchain**

- Solidity
- Foundry
- Forge
- Anvil
- Ethers.js
- MetaMask

**Frontend**

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- React Router

**Backend**

- Node.js
- Express.js
- MongoDB
- Mongoose
- Node crypto module for salt generation, AES-256-GCM salt encryption, and voter-hash generation
- SerialPort for ESP32/R307 fingerprint communication

**Biometric Modules**

- Python-based face recognition pipeline
- InsightFace / OpenCV-based face capture and verification
- ESP32 + R307 fingerprint sensor integration


---

## Project Structure 

```
    VoteChain/
    │
    ├── votechain-frontend-ts/          # React + TypeScript frontend
    │   ├── src/
    │   │   ├── components/
    │   │   ├── config/
    │   │   ├── hooks/
    │   │   └── lib/
    │   └── package.json
    │
    ├── votechain-central-server/       # Node.js/Express backend
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── utils/
    │   ├── server.js
    │   └── package.json
    │
    ├── votechain-face-recognition/     # Face capture, training, and recognition scripts
    │
    ├── src/                            # Solidity smart contracts
    │   └── LocalVoting.sol
    │
    ├── script/                         # Foundry deployment scripts
    │   └── LocalDeployVoting.s.sol
    │
    ├── test/                           # Foundry smart-contract tests
    │   └── LocalVotingTest.t.sol
    │
    └── README.md

```


---

## Installation and Setup

**Prerequisites**

Install the following:

- Node.js v18 or newer
- npm
- Python 3.10 or newer
- Foundry
- MetaMask browser extension
- MongoDB Atlas or local MongoDB
- ESP32/R307 fingerprint hardware if testing fingerprint verification

---

## 1. Install Frontend Dependencies

- cd votechain-frontend-ts
- npm install


## 2. Install Backend Dependencies

- cd votechain-central-server
- npm install

Create a .env file inside votechain-central-server/:
```
  MONGO_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  PORT=5000
  FRONTEND_URL=http://localhost:3000
  VOTER_SALT_SECRET_KEY=your_salt_secret_key
```

## 3. Install Face Recognition Dependencies

- cd votechain-face-recognition
- pip install -r requirements.txt

## 4. Build and Test Smart Contract

From the project root:

- forge build
- forge test

## 5. Start Local Blockchain

In a separate terminal:
- anvil


## 6. Deploy Smart Contract

From the project root:

```javascript
forge script script/LocalDeployVoting.s.sol:LocalDeployVoting \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <YOUR_ANVIL_PRIVATE_KEY> \
  --broadcast
```
After deployment, update the deployed contract address in:

- `votechain-frontend-ts/src/config/contract.ts`
- `votechain-central-server/utils/contract.js`


## 7. Run Backend Server

cd votechain-central-server
npm run dev

If no dev script is configured:

node server.js

The backend runs by default on:

http://localhost:5000


## 8. Run Frontend
cd votechain-frontend-ts
npm run dev

The frontend usually runs on:

http://localhost:3000

or the Vite-provided local URL.

---

## Smart Contract Functions

**The main contract is:**

`src/LocalVoting.sol`

Main functions:

```javascript
  registerCandidate(string name, string nationalId, string location, uint256 age, string party)

  registerVoter(string name, bytes32 voterHash, string location, string birthDate)

  castVote(string candidateNID, bytes32 voterHash)

  getCandidate(string candidateNID)

  getCandidates()

  getVoter(bytes32 voterHash)

  endElection()
```




## Voter Registration Flow

```javascript
  Admin opens Register Voter page
          ↓
  Admin enters voter details
          ↓
  Admin captures face/fingerprint data
          ↓
  Frontend sends voter data to backend
          ↓
  Backend:
  - generates random salt
  - encrypts salt using VOTER_SALT_SECRET_KEY
  - computes voterHash
  - stores voter profile in MongoDB
          ↓
  Backend returns voterHash
          ↓
  Frontend calls smart contract:
  registerVoter(name, voterHash, location, birthDate)
          ↓
  Voter hash is registered on-chain

```


## Vote Casting Flow

```javascript
  Voter opens voting page
          ↓
  Voter selects candidate
          ↓
  Biometric verification modal opens
          ↓
  Voter verifies using face or fingerprint
          ↓
  Backend identifies voter internally
          ↓
  Backend returns voterHash
          ↓
  Frontend calls:
  castVote(candidateNID, voterHash)
          ↓
  Smart contract verifies voterHash and candidateNID
          ↓
  Vote count is updated on-chain
```

## Public Dashboard Flow

```javascript
  User visits public dashboard
          ↓
  Frontend requests election data
          ↓
  Backend reads candidate/vote data from blockchain
          ↓
  Frontend displays candidate list and vote counts
```

---


## Security Design

The current prototype includes:

- Smart-contract-based duplicate-voting prevention
- Biometric verification before vote casting
- Pseudonymous voter-hash based blockchain interaction
- Off-chain storage of raw NID and biometric records
- Encrypted salt storage in MongoDB
- Immutable blockchain-based vote count update
- Admin-only candidate and voter registration through
- smart-contract access controlP