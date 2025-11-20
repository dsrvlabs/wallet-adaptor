# Wallet Adaptor SDK

Multi-package TypeScript wallet SDK for managing cryptocurrency wallets with support for multiple blockchains. Currently supports Ethereum (ETH), with an extensible architecture for adding additional chains (TRX, SOL, etc.).

## Overview

This SDK provides a modular, type-safe solution for:

- Generating HD wallet addresses using BIP44 derivation paths
- Signing blockchain transactions
- Secure mnemonic management via AWS Secrets Manager and KMS

## Architecture

The SDK is organized into three core packages:

- **`@dsrvlabs/wallet-core`**: Core types and interfaces (no runtime dependencies)
- **`@dsrvlabs/wallet-keys-aws`**: AWS Secrets Manager implementation for mnemonic storage
- **`@dsrvlabs/wallet-eth`**: Ethereum wallet adapter using ethers v6

## Packages

### @dsrvlabs/wallet-core

Pure TypeScript package containing shared types and interfaces. No runtime dependencies.

**Exports:**

- `CoinType`: Supported coin types (currently `60` for ETH)
- `HdChange`: HD wallet change values (`0 = deposit`, `1 = sender`, `2 = feePayer`, `3 = user`)
- `GenerateAddressParams`, `GeneratedAddress`: Types for address generation
- `UnsignedTx`, `SignedTx`: Transaction types
- `MnemonicProvider`: Interface for mnemonic retrieval
- `WalletAdapter`: Interface for wallet operations

### @dsrvlabs/wallet-keys-aws

AWS Secrets Manager implementation of `MnemonicProvider`. Retrieves mnemonics from AWS Secrets Manager using the format: `${organizationId}_${chainId}`.

**Features:**

- Supports multiple secret formats:
  - Plain string mnemonic
  - JSON: `{ "mnemonic": "word1 word2 ... word12" }`
  - JSON: `{ "parts": ["word1 word2 ...", "word13 ..."] }`
- Configurable AWS region

### @dsrvlabs/wallet-eth

Ethereum wallet adapter implementing `WalletAdapter` using ethers v6.

**Features:**

- BIP44 address derivation: `m/44'/60'/{accountId}'/{change}/{index}`
- Transaction signing with ethers v6
- Transaction hash computation

## Installation

### Using npm/pnpm workspace

If using this as a monorepo workspace:

```bash
# Install dependencies
pnpm install
# or
npm install
```

### As separate packages

If copying packages to separate repositories, install dependencies:

```bash
# In each package directory
cd packages/wallet-core
npm install
npm run build

cd ../wallet-keys-aws
npm install
npm run build

cd ../wallet-eth
npm install
npm run build
```

### Dependencies

- **TypeScript**: ^5.3.0
- **ethers**: ^6.9.0 (for wallet-eth)
- **@aws-sdk/client-secrets-manager**: ^3.490.0 (for wallet-keys-aws)

## Usage

### Basic Setup

```typescript
import { AwsMnemonicProvider } from "@dsrvlabs/wallet-keys-aws";
import { EthWalletAdapter } from "@dsrvlabs/wallet-eth";
import { GenerateAddressParams, UnsignedTx } from "@dsrvlabs/wallet-core";
import { TransactionRequest } from "ethers";

// Initialize the mnemonic provider
const mnemonicProvider = new AwsMnemonicProvider("us-east-1"); // or undefined for default region

// Initialize the ETH wallet adapter
const ethAdapter = new EthWalletAdapter(mnemonicProvider);
```

### Generate Address

```typescript
const params: GenerateAddressParams = {
  organizationId: "org-1234",
  chainId: 1, // Ethereum mainnet
  coinType: 60, // ETH
  accountId: 0,
  change: 0, // deposit
  index: 0,
};

const address = await ethAdapter.generateAddress(params);
console.log("Generated address:", address.address);
console.log("Public key:", address.publicKey);
console.log("Derivation path:", address.path);
// Output:
// Generated address: 0x...
// Public key: 0x...
// Derivation path: m/44'/60'/0'/0/0
```

### Sign Transaction

```typescript
const txRequest: TransactionRequest = {
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("0.1"),
  gasLimit: 21000,
  // ... other transaction fields
};

const unsignedTx: UnsignedTx = {
  organizationId: "org-1234",
  chainId: 1,
  coinType: 60,
  rawTx: txRequest,
};

const signedTx = await ethAdapter.signTransaction(unsignedTx);
console.log("Transaction hash:", signedTx.txHash);
console.log("Signed transaction:", signedTx.signedRawTx);
```

### Using WalletAdapterRegistry (Recommended)

For a cleaner API that supports multiple chains:

```typescript
import { AwsMnemonicProvider } from "@dsrvlabs/wallet-keys-aws";
import { EthWalletAdapter } from "@dsrvlabs/wallet-eth";
import { CoinType, WalletAdapter } from "@dsrvlabs/wallet-core";

class WalletAdapterRegistry {
  private adapters = new Map<CoinType, WalletAdapter>();

  constructor(mnemonicProvider: AwsMnemonicProvider) {
    // Register ETH adapter
    this.adapters.set(60, new EthWalletAdapter(mnemonicProvider));
    // Future: this.adapters.set(195, new TrxWalletAdapter(mnemonicProvider));
  }

  getAdapter(coinType: CoinType): WalletAdapter {
    const adapter = this.adapters.get(coinType);
    if (!adapter) {
      throw new Error(`No adapter found for coinType ${coinType}`);
    }
    return adapter;
  }
}

// Usage
const mnemonicProvider = new AwsMnemonicProvider();
const registry = new WalletAdapterRegistry(mnemonicProvider);

const adapter = registry.getAdapter(60); // ETH
const address = await adapter.generateAddress(params);
```

## AWS Configuration

### Prerequisites

1. AWS account with Secrets Manager access
2. IAM permissions for `secretsmanager:GetSecretValue`
3. Secrets stored in format: `${organizationId}_${chainId}`

### Secret Format

The SDK supports three secret formats:

**1. Plain string:**

```
word1 word2 word3 ... word12
```

**2. JSON with mnemonic field:**

```json
{
  "mnemonic": "word1 word2 word3 ... word12"
}
```

**3. JSON with parts array:**

```json
{
  "parts": ["word1 word2 word3", "word4 word5 word6", "..."]
}
```

### Example: Creating a Secret

```bash
# For organization 'org-1234' on Ethereum mainnet (chainId: 1)
aws secretsmanager create-secret \
  --name "org-1234_1" \
  --secret-string '{"mnemonic": "word1 word2 ... word12"}'
```

### IAM Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:*:*:secret:org-*_*"
    }
  ]
}
```

## Building

Each package can be built independently:

```bash
# Build all packages
cd packages/wallet-core && npm run build
cd ../wallet-keys-aws && npm run build
cd ../wallet-eth && npm run build
```

Or from the root (if using a workspace):

```bash
pnpm -r build
```

## Project Structure

```
wallet-adaptor/
├── packages/
│   ├── wallet-core/          # Core types and interfaces
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── key.interface.ts
│   │   │   ├── wallet.interface.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── wallet-keys-aws/      # AWS Secrets Manager provider
│   │   ├── src/
│   │   │   ├── aws-key.provider.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── wallet-eth/           # Ethereum adapter
│       ├── src/
│       │   ├── eth-wallet.adapter.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── examples/
│   └── usage-example.ts      # Example usage code
└── README.md
```

## TypeScript Configuration

All packages use:

- **Module**: ESM (`type: "module"` in package.json)
- **Module Resolution**: `NodeNext`
- **Target**: `ES2020`
- **Strict Mode**: Enabled

## HD Wallet Derivation

The SDK uses BIP44 derivation paths:

```
m/44'/60'/{accountId}'/{change}/{index}
```

Where:

- `44'`: BIP44 standard
- `60'`: Ethereum coin type (SLIP-0044)
- `{accountId}`: Account identifier
- `{change}`: Change index (0=deposit, 1=sender, 2=feePayer, 3=user)
- `{index}`: Address index

## Extending for Other Chains

To add support for additional blockchains:

1. Create a new adapter package (e.g., `@dsrvlabs/wallet-trx`, `@dsrvlabs/wallet-sol`)
2. Implement the `WalletAdapter` interface from `@dsrvlabs/wallet-core`
3. Use the appropriate coin type and derivation path for the chain
4. Register the adapter in your `WalletAdapterRegistry`

Example structure:

```typescript
import { WalletAdapter, CoinType } from "@dsrvlabs/wallet-core";

export class TrxWalletAdapter implements WalletAdapter {
  readonly supportedCoinTypes: CoinType[] = [195]; // TRX coin type

  // Implement generateAddress and signTransaction
}
```

## Security Considerations

1. **Mnemonic Storage**: Always use AWS Secrets Manager with KMS encryption
2. **IAM Permissions**: Follow principle of least privilege
3. **Transaction Signing**: The current implementation uses a default derivation path. In production, ensure `accountId`, `change`, and `index` are provided in the transaction context.
4. **Key Derivation**: Never log or expose private keys or mnemonics

## Example: MQ Consumer Integration

See `examples/usage-example.ts` for a complete example of integrating the SDK with a message queue consumer.

```typescript
import { processWalletJob } from "./examples/usage-example";

// In your MQ consumer
await processWalletJob({
  type: "GENERATE_ADDRESS",
  organizationId: "org-1234",
  chainId: 1,
  coinType: 60,
  accountId: 0,
  change: 0,
  index: 0,
});
```

# WALLET ADAPTOR Monorepo & GitHub Packages 배포 가이드

이 레포는 지갑 SDK를 위한 monorepo입니다.

- `@dsrvlabs/wallet-core`
- `@dsrvlabs/wallet-keys-aws`
- (추가 예정) `@dsrvlabs/wallet-eth` 등

SDK 패키지는 **GitHub Packages (npm 레지스트리)** 에 배포하고,  
각 Consumer 서버 프로젝트(eth-consumer, tron-consumer 등)는 GitHub Packages에서 이 패키지들을 설치해서 사용합니다.

이 문서는 **로컬 개발자 환경에서 GitHub Packages에 배포하는 방법**을 정리한 가이드입니다.

---

## 0. 전제

- GitHub Org: `dsrvlabs`
- 패키지 스코프: `@dsrvlabs`
- 레포: `https://github.com/dsrvlabs/wallet-adaptor`
- 배포 대상 패키지 (예시)
  - `packages/wallet-core`
  - `packages/wallet-keys-aws`

---

## 1. GitHub Personal Access Token (classic) 발급

GitHub Packages에 publish/설치를 하기 위해서는 **classic Personal Access Token(PAT)** 이 필요합니다.  
반드시 **fine-grained token이 아닌 classic token**을 사용해야 합니다.

1. GitHub 웹에서 우측 상단 프로필 클릭 → **Settings**
2. 좌측 메뉴 맨 아래 **Developer settings**
3. **Personal access tokens → Tokens (classic)** 이동
4. **Generate new token (classic)** 클릭
5. 설정:
   - **Note**: 예) `npm-packages`
   - **Expiration**: 원하는 기간 (90 days, 180 days 등)
   - **Scopes (권한)**:
     - `write:packages` ✅
     - `read:packages` ✅
     - (필요 시) `repo`도 선택 가능
6. 토큰 생성 후 나오는 값:
   - 예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 이 값은 **절대 노출/커밋 금지**, 로컬 환경변수 또는 `~/.npmrc`에서만 사용

---

## 2. 로컬 npm 설정 (`~/.npmrc`)

npm이 `@dsrvlabs` 스코프 패키지를 GitHub Packages에서 가져오도록 설정합니다.

1. 홈 디렉토리에 `.npmrc` 파일 생성 또는 수정:

   ```bash
   nano ~/.npmrc
   ```
