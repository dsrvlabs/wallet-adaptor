import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import {
  KMSClient,
  DecryptCommand,
} from "@aws-sdk/client-kms";
import {
  MnemonicProvider,
  MnemonicContext,
} from "@dsrvlabs/wallet-core";

export class AwsMnemonicProvider implements MnemonicProvider {
  private readonly secretsClient: SecretsManagerClient;
  private readonly kmsClient: KMSClient;
  private readonly mnemonicCache = new Map<string, Promise<string>>();

  constructor(region?: string) {
    const awsConfig = region ? { region } : {};
    this.secretsClient = new SecretsManagerClient(awsConfig);
    this.kmsClient = new KMSClient(awsConfig);
  }

  async getMnemonic(ctx: MnemonicContext): Promise<string> {
    const cacheKey = `${ctx.organizationId}_${ctx.chainId}`;
    
    // 캐시에 이미 있으면 기존 Promise 반환 (싱글톤 패턴)
    if (this.mnemonicCache.has(cacheKey)) {
      return this.mnemonicCache.get(cacheKey)!;
    }

    // 캐시에 없으면 새로 가져와서 캐시에 저장
    const mnemonicPromise = this.fetchAndDecryptMnemonic(cacheKey);
    this.mnemonicCache.set(cacheKey, mnemonicPromise);
    
    return mnemonicPromise;
  }

  private async fetchAndDecryptMnemonic(secretName: string): Promise<string> {
    const encryptedMnemonic = await this.getEncryptedMnemonicFromSecretsManager(secretName);
    return await this.decryptWithKMS(encryptedMnemonic);
  }

  private async decryptWithKMS(ciphertext: string): Promise<string> {
    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertext, "base64"),
    });
    const response = await this.kmsClient.send(command);
    return Buffer.from(response.Plaintext!).toString("utf-8");
  }

  private async getEncryptedMnemonicFromSecretsManager(secretName: string): Promise<string> {
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });
    const response = await this.secretsClient.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret value is empty for ${secretName}`);
    }

    const secret = JSON.parse(response.SecretString);
    const completeMnemonic = secret.mnemonic_share_1 + secret.mnemonic_share_2;
    return completeMnemonic as string;
  }
}

