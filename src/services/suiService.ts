import fetch from 'node-fetch';

const RPC_URLS: Record<string, string> = {
    mainnet: 'https://fullnode.mainnet.sui.io:443',
    testnet: 'https://fullnode.testnet.sui.io:443',
    devnet: 'https://fullnode.devnet.sui.io:443',
};

export class SuiService {
    static getRpcUrl(network: string = 'testnet'): string {
        return RPC_URLS[network] || RPC_URLS.testnet;
    }

    static async getTransactionBlock(digest: string, network: string = 'testnet') {
        try {
            const response = await fetch(this.getRpcUrl(network), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'sui_getTransactionBlock',
                    params: [digest, { showEffects: true, showInput: true }]
                })
            });

            const data: any = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'RPC Error');
            }

            return data.result;
        } catch (error: any) {
            console.error(`[SuiService] Failed to fetch TX ${digest}:`, error.message);
            throw error;
        }
    }

    static async verifyTransactionStatus(digest: string, network: string = 'testnet'): Promise<boolean> {
        const tx = await this.getTransactionBlock(digest, network);
        return tx?.effects?.status?.status === 'success';
    }
}
