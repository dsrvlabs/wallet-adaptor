import { HDNodeWallet } from "ethers";
export class EthWalletAdapter {
    constructor() { }
    async generateAddress(params) {
        const { mnemonic, hdpath, } = params;
        // ethers HDNodeWallet.fromPhrase로 루트 지갑 생성
        const root = HDNodeWallet.fromPhrase(mnemonic);
        // derivePath는 상대 경로를 사용해야 하므로 "m/" 제거
        const relativePath = hdpath.startsWith("m/") ? hdpath.slice(2) : hdpath;
        const node = root.derivePath(relativePath);
        // 주소 가져오기
        const address = await node.getAddress();
        return {
            address,
            publicKey: node.publicKey,
        };
    }
    async signTransaction(tx) {
        // TODO: use mnemonicProvider and ethers Wallet to sign tx.rawTx
        throw new Error("EthWalletAdapter.signTransaction is not implemented yet.");
    }
}
