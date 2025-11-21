import {
  GenerateAddressParams,
  GeneratedAddress,
  WalletAdapter,
} from "@dsrvlabs/wallet-core";
import { HDNodeWallet } from "ethers";

export class EthWalletAdapter implements WalletAdapter {
  constructor() {}

  async generateAddress(params: GenerateAddressParams): Promise<GeneratedAddress> {
    const {
      mnemonic,
      hdpath,
    } = params;

    // ethers HDNodeWallet.fromPhrase로 루트 지갑 생성
    const root = HDNodeWallet.fromPhrase(mnemonic);

    const node = root.derivePath(hdpath);

    // 주소 가져오기
    const address = await node.getAddress();

    return {
      address,
      publicKey: node.publicKey,
    };
  }

  async signTransaction(tx: any): Promise<any> {
    // TODO: use mnemonicProvider and ethers Wallet to sign tx.rawTx
    throw new Error("EthWalletAdapter.signTransaction is not implemented yet.");
  }
}
