# Wallet SDK

Multi-package TypeScript wallet SDK for managing cryptocurrency wallets with support for multiple blockchains. Currently supports Ethereum (ETH), with an extensible architecture for adding additional chains (TRX, SOL, etc.).

## Overview

This SDK provides a modular, type-safe solution for:

- Generating HD wallet addresses using BIP44 derivation paths
- Signing blockchain transactions (planned)
- Flexible mnemonic and HD path management

## Architecture

The SDK is organized into two core packages:

- **`@dsrvlabs/wallet-types`**: Core types and interfaces (no runtime dependencies, internal package)
- **`@dsrvlabs/wallet-eth`**: Ethereum wallet adapter using ethers v6

## Packages

### @dsrvlabs/wallet-types

Pure TypeScript package containing shared types and interfaces. No runtime dependencies.

**Note:** This is an internal package used within the monorepo and is not published to npm. It's only available for internal use via workspace protocol.

**Exports:**

- `HdChange`: HD wallet change values (`0 = deposit`, `1 = sender`, `2 = feePayer`, `3 = user`)
- `GenerateAddressParams`, `GeneratedAddress`: Types for address generation
- `MnemonicProvider`: Interface for mnemonic retrieval (optional, for custom implementations)
- `WalletAdapter`: Interface for wallet operations

### @dsrvlabs/wallet-eth

Ethereum wallet adapter implementing `WalletAdapter` using ethers v6.

**Features:**

- HD wallet address generation using custom derivation paths
- Mnemonic and HD path based address generation
- Transaction signing with ethers v6 (planned)

## Installation

### Install from GitHub (Recommended)

You can install the package directly from GitHub without needing `.npmrc` or GitHub Packages authentication:

```bash
# Using pnpm
pnpm add github:dsrvlabs/wallet-sdk#packages/wallet-eth

# Using npm
npm install github:dsrvlabs/wallet-sdk#packages/wallet-eth

# Using yarn
yarn add github:dsrvlabs/wallet-sdk#packages/wallet-eth
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "@dsrvlabs/wallet-eth": "github:dsrvlabs/wallet-sdk#packages/wallet-eth"
  }
}
```

**Note:** You can specify a specific branch, tag, or commit:
- `github:dsrvlabs/wallet-sdk#main:packages/wallet-eth` (specific branch)
- `github:dsrvlabs/wallet-sdk#v0.0.1:packages/wallet-eth` (specific tag)
- `github:dsrvlabs/wallet-sdk#abc1234:packages/wallet-eth` (specific commit)

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
cd packages/wallet-types
npm install
npm run build

cd ../wallet-eth
npm install
npm run build
```

### Dependencies

- **TypeScript**: ^5.3.0
- **ethers**: ^6.9.0 (for wallet-eth)

## Usage

### Basic Setup

```typescript
import { EthWalletAdapter, GenerateAddressParams } from "@dsrvlabs/wallet-eth";

// Initialize the ETH wallet adapter
const ethAdapter = new EthWalletAdapter();
```

### Generate Address

```typescript
// Provide mnemonic and HD derivation path
const params: GenerateAddressParams = {
  mnemonic:
    "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12",
  hdpath: "m/44'/60'/0'/0/0", // BIP44 derivation path for Ethereum
};

const result = await ethAdapter.generateAddress(params);
console.log("Generated address:", result.address);
console.log("Public key:", result.publicKey);
// Output:
// Generated address: 0x...
// Public key: 0x...
```

### Example: Generate Multiple Addresses

```typescript
const mnemonic =
  "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
const accountId = 0;

// Generate addresses for different purposes
const depositAddress = await ethAdapter.generateAddress({
  mnemonic,
  hdpath: `m/44'/60'/${accountId}'/0/0`, // deposit
});

const senderAddress = await ethAdapter.generateAddress({
  mnemonic,
  hdpath: `m/44'/60'/${accountId}'/1/0`, // sender
});

const feePayerAddress = await ethAdapter.generateAddress({
  mnemonic,
  hdpath: `m/44'/60'/${accountId}'/2/0`, // feePayer
});

const userAddress = await ethAdapter.generateAddress({
  mnemonic,
  hdpath: `m/44'/60'/${accountId}'/3/0`, // user
});
```

## Mnemonic Management

The SDK requires you to provide the mnemonic directly when generating addresses. In production, you should:

1. **Store mnemonics securely** (e.g., AWS Secrets Manager, HashiCorp Vault, or other secure storage)
2. **Retrieve mnemonics securely** before calling `generateAddress`
3. **Never commit mnemonics** to version control
4. **Use environment variables or secure configuration** for development

### Example: Using Environment Variables

```typescript
const mnemonic = process.env.WALLET_MNEMONIC;
if (!mnemonic) {
  throw new Error("WALLET_MNEMONIC environment variable is required");
}

const ethAdapter = new EthWalletAdapter();
const address = await ethAdapter.generateAddress({
  mnemonic,
  hdpath: "m/44'/60'/0'/0/0",
});
```

## Building

Each package can be built independently:

```bash
# Build all packages
cd packages/wallet-types && npm run build
cd ../wallet-eth && npm run build
```

Or from the root (if using a workspace):

```bash
pnpm -r build
```

## Project Structure

```
wallet-sdk/
├── packages/
│   ├── wallet-types/        # Core types and interfaces (internal)
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── key.interface.ts
│   │   │   ├── wallet.interface.ts
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
│   └── wallet.test.ts       # Test suite and usage examples
└── README.md
```

## TypeScript Configuration

All packages use:

- **Module**: ESM (`type: "module"` in package.json)
- **Module Resolution**: `NodeNext`
- **Target**: `ES2020`
- **Strict Mode**: Enabled

## HD Wallet Derivation

The SDK supports BIP44 derivation paths. You provide the full HD path when generating addresses.

### Standard BIP44 Path Format

```
m/44'/60'/{accountId}'/{change}/{index}
```

Where:

- `44'`: BIP44 standard
- `60'`: Ethereum coin type (SLIP-0044)
- `{accountId}`: Account identifier
- `{change}`: Change index (0=deposit, 1=sender, 2=feePayer, 3=user)
- `{index}`: Address index

### Example Paths

```typescript
// Main account, deposit address, first address
"m/44'/60'/0'/0/0";

// Main account, sender address, first address
"m/44'/60'/0'/1/0";

// Second account, user address, first address
"m/44'/60'/1'/3/0";
```

## Extending for Other Chains

To add support for additional blockchains:

1. Create a new adapter package (e.g., `@dsrvlabs/wallet-trx`, `@dsrvlabs/wallet-sol`)
2. Add `@dsrvlabs/wallet-types` as a workspace dependency: `"@dsrvlabs/wallet-types": "workspace:*"`
3. Implement the `WalletAdapter` interface from `@dsrvlabs/wallet-types`
4. Use the appropriate derivation path for the chain (e.g., `m/44'/195'/...` for TRX)

Example structure:

```typescript
import {
  WalletAdapter,
  GenerateAddressParams,
  GeneratedAddress,
} from "@dsrvlabs/wallet-types";

export class TrxWalletAdapter implements WalletAdapter {
  constructor() {}

  async generateAddress(
    params: GenerateAddressParams
  ): Promise<GeneratedAddress> {
    const { mnemonic, hdpath } = params;
    // Implement address generation for TRX
    // ...
  }
}
```

## Security Considerations

1. **Mnemonic Storage**: Store mnemonics securely (AWS Secrets Manager, HashiCorp Vault, etc.)
2. **Mnemonic Handling**: Never commit mnemonics to version control or log them
3. **HD Path Management**: Ensure HD derivation paths are managed securely and consistently
4. **Key Derivation**: Never log or expose private keys, mnemonics, or derivation paths
5. **Environment Variables**: Use secure environment variable management in production

## Testing

The SDK includes test examples in the `examples` directory. Run the tests to see the SDK in action:

```bash
cd examples
pnpm test
```

The test suite demonstrates:

- Basic address generation
- Multiple address generation for different purposes
- MQ consumer integration patterns
- HD path variations

### Example: MQ Consumer Integration

Here's a simple example of how to integrate the SDK with a message queue consumer:

```typescript
import { EthWalletAdapter, GenerateAddressParams } from "@dsrvlabs/wallet-eth";

// In your MQ consumer
async function handleGenerateAddressJob(mnemonic: string, hdpath: string) {
  const ethAdapter = new EthWalletAdapter();

  const params: GenerateAddressParams = {
    mnemonic,
    hdpath,
  };

  const result = await ethAdapter.generateAddress(params);
  return result;
}
```

For more complete examples, see `examples/wallet.test.ts`.

# Wallet SDK Monorepo & GitHub Packages 배포 가이드

이 레포는 지갑 SDK를 위한 monorepo입니다.

- `@dsrvlabs/wallet-types` (내부 패키지, 배포 안 함)
- `@dsrvlabs/wallet-eth` (배포 대상)
- (추가 예정) `@dsrvlabs/wallet-trx`, `@dsrvlabs/wallet-sol` 등

SDK 패키지는 **GitHub Packages (npm 레지스트리)** 에 배포하고,  
각 Consumer 서버 프로젝트(eth-consumer, tron-consumer 등)는 GitHub Packages에서 이 패키지들을 설치해서 사용합니다.

이 문서는 **로컬 개발자 환경에서 GitHub Packages에 배포하는 방법**을 정리한 가이드입니다.

---

## 0. 전제

- GitHub Org: `dsrvlabs`
- 패키지 스코프: `@dsrvlabs`
- 레포: `https://github.com/dsrvlabs/wallet-sdk`
- 배포 대상 패키지
  - `packages/wallet-eth` (wallet-types는 내부 패키지로 배포 안 함)

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

2. 다음 내용을 추가:

   ```
   @dsrvlabs:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

   - `YOUR_GITHUB_TOKEN`을 위에서 발급한 Personal Access Token으로 교체
   - 이 파일은 **절대 Git에 커밋하지 않음** (`.gitignore`에 포함되어 있음)

---

## 3. 패키지 빌드

배포하기 전에 모든 패키지를 빌드해야 합니다.

```bash
# 루트 디렉토리에서 모든 패키지 빌드
pnpm -r build

# 또는 개별 패키지 빌드
cd packages/wallet-types && pnpm build
cd ../wallet-eth && pnpm build
```

---

## 4. npm publish

각 패키지를 GitHub Packages에 배포합니다.

**Note:** `@dsrvlabs/wallet-types`는 내부 패키지로 배포되지 않습니다. `@dsrvlabs/wallet-eth`만 배포합니다.

### wallet-eth 배포

```bash
cd packages/wallet-eth
npm publish
```

### 주의사항

- **버전 관리**: `package.json`의 `version` 필드를 업데이트한 후 배포
- **태그 사용**: 버전을 낮추는 경우 `npm publish --tag <tag-name>` 사용
- **인증 오류**: `ENEEDAUTH` 오류가 발생하면 `~/.npmrc`의 토큰이 올바른지 확인

### 버전 업데이트 예시

```bash
# package.json에서 version 수정 후
cd packages/wallet-eth
npm version patch  # 0.0.1 -> 0.0.2
npm publish
```

---

## 5. 패키지 설치 (Consumer 프로젝트에서)

다른 프로젝트에서 이 패키지들을 사용하는 방법:

### 방법 1: GitHub에서 직접 설치 (추천, .npmrc 불필요)

가장 간단한 방법입니다. `.npmrc` 파일이나 인증이 필요 없습니다:

```bash
# pnpm 사용
pnpm add github:dsrvlabs/wallet-sdk#packages/wallet-eth

# npm 사용
npm install github:dsrvlabs/wallet-sdk#packages/wallet-eth

# yarn 사용
yarn add github:dsrvlabs/wallet-sdk#packages/wallet-eth
```

또는 `package.json`에 직접 추가:

```json
{
  "dependencies": {
    "@dsrvlabs/wallet-eth": "github:dsrvlabs/wallet-sdk#packages/wallet-eth"
  }
}
```

**특정 브랜치/태그/커밋 지정:**
- `github:dsrvlabs/wallet-sdk#main:packages/wallet-eth` (특정 브랜치)
- `github:dsrvlabs/wallet-sdk#v0.0.1:packages/wallet-eth` (특정 태그)
- `github:dsrvlabs/wallet-sdk#abc1234:packages/wallet-eth` (특정 커밋)

**Note:** `@dsrvlabs/wallet-types`는 내부 패키지이므로 별도로 설치할 필요가 없습니다. `@dsrvlabs/wallet-eth`가 필요한 타입을 모두 export합니다.

### 방법 2: GitHub Packages 사용 (.npmrc 필요)

GitHub Packages를 통해 설치하려면:

1. 프로젝트 루트에 `.npmrc` 파일 생성:

   ```
   @dsrvlabs:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

2. `package.json`에 의존성 추가:

   ```json
   {
     "dependencies": {
       "@dsrvlabs/wallet-eth": "^0.0.1"
     }
   }
   ```

3. 설치:

   ```bash
   npm install
   # 또는
   pnpm install
   ```
