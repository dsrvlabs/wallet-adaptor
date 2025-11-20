import {
  MnemonicProvider,
  MnemonicContext,
} from "@dsrv/wallet-core";

export class AwsMnemonicProvider implements MnemonicProvider {
  // In the future, we'll inject AWS region / client here.
  constructor(private readonly region?: string) {}

  async getMnemonic(ctx: MnemonicContext): Promise<string> {
    // TODO: implement integration with AWS Secrets Manager
    // using secretName = `${ctx.organizationId}_${ctx.chainId}`.
    throw new Error("AwsMnemonicProvider.getMnemonic is not implemented yet.");
  }
}

