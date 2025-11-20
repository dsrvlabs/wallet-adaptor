import {
  GenerateAddressParams,
  GeneratedAddress,
  SignedTx,
  MnemonicProvider,
  WalletAdapter,
} from "@dsrvlabs/wallet-core";
import { HDNodeWallet } from "ethers";

export class EthWalletAdapter implements WalletAdapter {
  constructor(
    private readonly mnemonicProvider: MnemonicProvider,
  ) {}

  async generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress> {
    const {
      organizationId,
      chainId,
      accountId,
      change,
      index,
      coinType,
    } = params;

    // mnemonicProvider를 통해 니모닉 가져오기
    const mnemonic = await this.mnemonicProvider.getMnemonic({
      organizationId,
      chainId,
    });

    // ethers HDNodeWallet.fromPhrase로 루트 지갑 생성
    const root = HDNodeWallet.fromPhrase(mnemonic);

    const path = `m/44'/${coinType}'/${accountId}'/${change}/${index}`;
    const node = root.derivePath(path);

    // 주소 가져오기
    const address = await node.getAddress();

    return {
      address,
      publicKey: node.publicKey,
      path,
    };
  }

  async signTransaction(tx: any): Promise<SignedTx> {
    // TODO: use mnemonicProvider and ethers Wallet to sign tx.rawTx
    throw new Error("EthWalletAdapter.signTransaction is not implemented yet.");
  }
}
