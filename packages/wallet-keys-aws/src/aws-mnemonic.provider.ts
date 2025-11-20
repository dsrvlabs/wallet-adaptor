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

  constructor(region?: string) {
    const awsConfig = region ? { region } : {};
    this.secretsClient = new SecretsManagerClient(awsConfig);
    this.kmsClient = new KMSClient(awsConfig);
  }

  async getMnemonic(ctx: MnemonicContext): Promise<string> {
    const secretName = `${ctx.organizationId}_${ctx.chainId}`;
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

