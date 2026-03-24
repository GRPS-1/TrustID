<div align="center">

# TrustID

### W3C-Compliant Decentralized Identity on Algorand

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue?style=flat-square)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18%2B-green?style=flat-square)](https://nodejs.org/)
[![TypeScript 5.x](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org/)
[![Algorand Testnet](https://img.shields.io/badge/Algorand-Testnet-purple?style=flat-square)](https://developer.algorand.org/)
[![W3C DID Core 1.0](https://img.shields.io/badge/W3C%20DID-Core%201.0-brightgreen?style=flat-square)](https://www.w3.org/TR/did-core/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](./LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://trust-id-seven.vercel.app)

**TrustID** is a production-grade, open-source decentralized identifier (DID) system built on the Algorand blockchain. It enables users to create, manage, and cryptographically verify credentials — with full W3C DID Core 1.0 compliance, IPFS-backed storage, and Universal Resolver compatibility.

[Live Demo](https://trust-id-seven.vercel.app) · [Report a Bug](https://github.com/GRPS-1/TrustID/issues) · [Request a Feature](https://github.com/GRPS-1/TrustID/issues)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Smart Contracts](#-smart-contracts)
- [API Reference](#-api-reference)
- [Pages & UI](#-pages--ui)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## Overview

TrustID is a **self-sovereign identity (SSI)** platform that gives users complete ownership of their digital credentials. Built on the Algorand blockchain, it enables tamper-proof storage, privacy-preserving access control, and globally resolvable DIDs — all without relying on central authorities.

### DID Format

```
did:algo:testnet:<algorand-address>
```

Example:
```
did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Self-Sovereign** | Users own and fully control their identities |
| **Cryptographically Secure** | Ed25519 signatures anchored on Algorand |
| **Immutable** | Credentials stored on-chain with IPFS integration |
| **Granular Access** | Public/private modes with time-limited access grants |
| **Globally Resolvable** | Compatible with the [Universal Resolver](https://dev.uniresolver.io) |
| **Standards-Compliant** | Full W3C DID Core 1.0 and DID Resolution specification support |

---

## Features

| Feature | Description |
|---------|-------------|
| **DID Creation** | Create a decentralized identifier anchored to your Algorand wallet |
| **Credential Management** | Upload, retrieve, and revoke verifiable credentials on-chain |
| **Access Control** | Granular public/private visibility per credential |
| **Time-Limited Grants** | Delegate credential access with expiry timestamps |
| **W3C DID Documents** | DID Documents served via a standards-compliant REST endpoint |
| **Universal Resolver** | DIDs resolvable at `dev.uniresolver.io` globally |
| **IPFS Integration** | Large files stored on IPFS; only the content hash lives on-chain |
| **AES-256 Encryption** | Private credentials encrypted with PBKDF2-derived keys |
| **Algorand Box Storage** | Scalable, efficient on-chain indexing via Algorand boxes |
| **Multi-Page Dashboard** | Intuitive UI for credential lifecycle management |
| **Pera Wallet Connect** | Native Algorand wallet integration in the browser |

---

## Project Structure

```
TrustID/
├── frontend/                         # Next.js 16 + TypeScript frontend
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   ├── page.tsx              # Home — feature showcase & landing
│   │   │   ├── profile/              # DID creation & identity management
│   │   │   ├── add/                  # Credential upload & submission
│   │   │   ├── my-credentials/       # User credential dashboard
│   │   │   ├── verify/               # Public credential verification
│   │   │   ├── did/                  # DID resolver UI
│   │   │   ├── share/                # Access grant management
│   │   │   └── api/
│   │   │       ├── identifiers/[did]/route.ts   # W3C DID Resolution endpoint
│   │   │       ├── credentials/[address]/route.ts # Credential listing endpoint
│   │   │       ├── debug-boxes/route.ts          # Dev: inspect on-chain boxes
│   │   │       └── test-resolver/route.ts        # Dev: test DID resolution
│   │   ├── components/               # Reusable React components
│   │   ├── lib/
│   │   │   ├── algorand.ts           # Algorand SDK configuration & helpers
│   │   │   ├── contract.ts           # Smart contract interaction layer
│   │   │   └── did.ts                # DID creation & document construction
│   │   └── types/                    # Shared TypeScript type definitions
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.ts
│
├── algorand/                         # Algorand smart contracts (Python)
│   └── projects/
│       └── trustid/
│           ├── smart_contracts/
│           │   └── trustid/
│           │       ├── contract.py   # Core TrustID AVM smart contract
│           │       └── deploy_config.py
│           ├── tests/                # Contract unit tests
│           ├── pyproject.toml        # Poetry dependency manifest
│           └── .algokit.toml        # AlgoKit project config
│
└── README.md
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│              Universal Resolver (dev.uniresolver.io)             │
└───────────────────────────┬──────────────────────────────────────┘
                            │  GET /identifiers/{did}
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    TrustID Frontend (Next.js)                    │
│                                                                  │
│  Pages:  Home · Profile · Add · My Credentials · Verify         │
│          DID Resolver · Share                                    │
│                                                                  │
│  API Routes:                                                     │
│  • /api/identifiers/[did]       → W3C DID Document              │
│  • /api/credentials/[address]   → Credential list               │
└──────────┬────────────────────┬─────────────────────────────────┘
           │ Contract calls     │ Wallet signing
           ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Algorand Blockchain (Testnet)                  │
│                                                                  │
│   TrustID Smart Contract — App ID: 757490823                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  add_credential()   get_credential()   grant_access()   │   │
│   │  revoke_access()    parse_owner()      is_revoked()      │   │
│   │                                                         │   │
│   │  Storage: Box per credential  →  cred_{id}              │   │
│   │  Format:  hash|owner|cid|type|timestamp|status|access   │   │
│   └─────────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────────┘
                 │
       ┌─────────┴────────┐
       ▼                  ▼
┌─────────────┐   ┌──────────────┐
│    IPFS     │   │  Pera Wallet │
│ (File CDN)  │   │  (Signing)   │
└─────────────┘   └──────────────┘
```

### Data Flow

1. User connects **Pera Wallet** → Algorand address obtained
2. User creates DID at `/profile` → DID registered on-chain
3. User uploads credential at `/add` → file hashed, stored on IPFS, record written to Algorand box
4. User shares credential at `/share` → access grant stored on-chain with expiry
5. Verifier opens `/verify` → credential resolved from blockchain, signature validated
6. External resolver calls `/api/identifiers/{did}` → W3C DID Document returned

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI framework |
| Next.js | 16.x | Full-stack React framework + API routes |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first styling |
| Lucide React | Latest | Icon system |
| Algorand SDK (`algosdk`) | 3.5.2 | Blockchain interaction |
| Pera Wallet Connect | 1.5.1 | Browser wallet integration |
| ESLint 9 | Latest | Code linting |

### Smart Contracts

| Technology | Version | Purpose |
|------------|---------|---------|
| Algorand Python | 3.x | Smart contract language |
| PuyaPy | Latest | Python → AVM TEAL compiler |
| AlgoKit CLI | 2.0.0+ | Project scaffolding & deployment |
| algokit-utils | 4.0.0 | TypeScript/Python client utilities |
| Python | 3.12+ | Runtime environment |
| Poetry | Latest | Dependency & virtual env management |
| pytest | Latest | Contract unit testing |

### Infrastructure

| Layer | Technology |
|-------|-----------|
| Blockchain | Algorand Testnet (upgradeable to Mainnet) |
| RPC Nodes | [AlgoNode](https://algonode.io) public nodes |
| Decentralized Storage | IPFS |
| Frontend Hosting | Vercel |
| Local Dev Network | AlgoKit LocalNet (Docker) |

---

## Getting Started

### Prerequisites

Make sure the following tools are installed:

- **Node.js** 18+ and **npm**
- **Python** 3.12+
- **Poetry** — `pip install poetry`
- **AlgoKit CLI** 2.0.0+ — `npm install -g @algorandfoundation/algokit`
- **Docker** *(optional — for local Algorand network)*
- **Pera Wallet** browser extension or mobile app for testing

---

### 1. Clone the Repository

```bash
git clone https://github.com/GRPS-1/TrustID.git
cd TrustID
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_ALGORAND_APP_ID=757490823
NEXT_PUBLIC_NETWORK=testnet
```

Start the development server:

```bash
npm run dev
# Open http://localhost:3000
```

---

### 3. Smart Contracts Setup

```bash
cd algorand/projects/trustid

# Install Python dependencies via Poetry
poetry install

# Bootstrap and compile contracts
algokit project bootstrap all
algokit project run build
```

**Deploy to LocalNet (optional):**

```bash
# In a separate terminal, start the local Algorand network
algokit localnet start

# Deploy the TrustID contract
algokit project deploy localnet
```

After deployment, update `NEXT_PUBLIC_ALGORAND_APP_ID` in `.env.local` with the newly assigned App ID.

---

### 4. First Run Checklist

- [ ] Start the frontend: `npm run dev` inside `frontend/`
- [ ] Open [http://localhost:3000](http://localhost:3000)
- [ ] Connect your Pera Wallet
- [ ] Navigate to `/profile` to create your DID
- [ ] Upload your first credential at `/add`
- [ ] Verify it at `/verify`

---

## Smart Contracts

### Contract Overview

| Property | Value |
|----------|-------|
| **File** | `algorand/projects/trustid/smart_contracts/trustid/contract.py` |
| **Language** | Algorand Python (compiled via PuyaPy) |
| **Network** | Algorand Testnet |
| **App ID** | `757490823` |

### Contract Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `add_credential` | `cred_id`, `hash_value`, `cid`, `cred_type`, `access` | success flag | Stores credential metadata to an on-chain box |
| `get_credential` | `cred_id` | credential data | Retrieves credential, enforcing access control |
| `grant_access` | `cred_id`, `grantee`, `expiry_timestamp` | success flag | Grants time-limited read access to a grantee |
| `revoke_access` | `cred_id`, `grantee` | success flag | Revokes a previously issued access grant |
| `parse_owner` | `value`, `hash_length` | address | Extracts the owner address from box data |
| `parse_access` | `value` | access flag | Extracts the public/private visibility flag |
| `is_revoked` | `value` | boolean | Checks whether a credential has been revoked |

### Storage Design

**Box Storage** — one box per credential:

```
Key:    cred_{credential_id}
Value:  hash|owner|cid|type|timestamp|status|access
```

**Access Grant Boxes:**

```
Key:    g_{hash(cred_id)}_{grantee_address}
Value:  expiry_timestamp
```

### Access Control Model

| Level | Who Can Read |
|-------|-------------|
| **Public** | Anyone |
| **Private** | Credential owner only |
| **Private + Grant** | Owner + all valid, non-expired grantees |
| **Revoked** | Nobody (owner can re-enable) |

---

## API Reference

### `GET /api/identifiers/{did}`

Resolves a TrustID DID to a W3C-compliant DID Document. Compatible with the [Universal Resolver](https://dev.uniresolver.io).

**Example:**

```bash
curl https://trust-id-seven.vercel.app/api/identifiers/did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

**Response `200 OK`:**

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI",
  "verificationMethod": [
    {
      "id": "did:algo:testnet:6E245...#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:algo:testnet:6E245...",
      "publicKeyBase58": "<base58-encoded-public-key>"
    }
  ],
  "authentication": [
    "did:algo:testnet:6E245...#keys-1"
  ]
}
```

---

### `GET /api/credentials/{address}`

Returns all public credentials associated with an Algorand address.

**Example:**

```bash
curl https://trust-id-seven.vercel.app/api/credentials/6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

**Response `200 OK`:**

```json
{
  "credentials": [
    {
      "id": "cred_001",
      "hash": "QmXoypizjW...",
      "cid": "bafyreib...",
      "type": "certificate",
      "timestamp": 1703001600,
      "access": "public"
    }
  ]
}
```

---

### Development-Only Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/debug-boxes` | Inspect all credential boxes on-chain |
| `GET /api/test-resolver` | Test the DID resolution pipeline |

>  These endpoints are intended for local development only. Do not expose them in production.

---

## Pages & UI

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Feature showcase, use cases, and onboarding flow |
| `/profile` | Profile | Create and manage your DID |
| `/add` | Add Credential | Upload and register a new credential on-chain |
| `/my-credentials` | Dashboard | View, share, and revoke your credentials |
| `/verify` | Verify | Publicly verify any credential by ID |
| `/did` | DID Resolver | Resolve any TrustID DID to its DID Document |
| `/share` | Share | Manage time-limited access grants |

---

## Deployment

### Frontend — Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from the frontend directory
cd frontend
vercel
```

Set these environment variables in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_ALGORAND_APP_ID` | Your deployed App ID (e.g. `757490823`) |
| `NEXT_PUBLIC_NETWORK` | `testnet` or `mainnet` |

---

### Smart Contracts — Algorand Testnet

```bash
cd algorand/projects/trustid

# Deploy to Testnet
algokit project deploy testnet
```

### Smart Contracts — Algorand Mainnet

```bash
algokit project deploy mainnet
```

After deployment, update `NEXT_PUBLIC_ALGORAND_APP_ID` in your environment configuration to reflect the new App ID.

---

## Contributing

Contributions are welcome! Please follow these steps:

### Development Workflow

1. **Fork** this repository and clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/TrustID.git
   cd TrustID
   ```

2. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes.** Write clear, conventional commits:

   ```bash
   git commit -m "feat: add [feature name]"
   git commit -m "fix: resolve [issue description]"
   git commit -m "docs: update [section name]"
   ```

4. **Push and open a Pull Request:**

   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

| Language | Standard |
|----------|----------|
| TypeScript | Strict mode; avoid `any` types |
| Python | PEP 8; use type hints throughout |
| Commits | [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`) |

### Key Files for Contributors

| File | Purpose |
|------|---------|
| `algorand/projects/trustid/smart_contracts/trustid/contract.py` | Core AVM smart contract |
| `frontend/src/lib/did.ts` | DID creation & document building |
| `frontend/src/lib/contract.ts` | Smart contract interaction layer |
| `frontend/src/lib/algorand.ts` | Algorand SDK configuration |
| `frontend/src/app/api/` | Next.js API routes |

### Reporting Issues

When opening a bug report, please include:

- Steps to reproduce the issue
- Expected vs. actual behaviour
- Your environment (OS, Node.js version, browser, wallet)
- Any relevant error messages or screenshots

---

## References

- [W3C DID Core 1.0 Specification](https://www.w3.org/TR/did-core/)
- [W3C DID Resolution Specification](https://w3c-ccg.github.io/did-resolution/)
- [Universal Resolver](https://dev.uniresolver.io)
- [Algorand Developer Portal](https://developer.algorand.org/)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)
- [Algorand Python Documentation](https://algorandfoundation.github.io/puya/)
- [Pera Wallet Connect](https://github.com/perawallet/connect)
- [Next.js Documentation](https://nextjs.org/docs)

---

## License

-----------------------------------------------------------------------------

---

<div align="center">

Built on Algorand · Live at [trust-id-seven.vercel.app](https://trust-id-seven.vercel.app)

TrustID maintains full compliance with the **W3C DID Core 1.0** specification and is compatible with the global decentralized identity ecosystem.

</div>
