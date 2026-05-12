import fetch from 'node-fetch';
import { getDB, saveDB } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const SUI_RPC_URL = process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const PACKAGE_ID = process.env.PACKAGE_ID;
const INTERVAL_MS = parseInt(process.env.WATCHER_INTERVAL_MS || '10000');

let isRunning = false;
let lastCursor: any = null;

export const startSuiWatcher = async () => {
    if (!PACKAGE_ID) {
        console.warn('⚠️ SuiWatcher: PACKAGE_ID not set. Watcher disabled.');
        return;
    }

    console.log(`📡 SuiWatcher: Starting to monitor package ${PACKAGE_ID}...`);
    
    // Initial poll to set cursor to latest
    try {
        const res = await fetch(SUI_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'sui_queryEvents',
                params: [
                    { MoveModule: { package: PACKAGE_ID, module: 'web3' } },
                    null,
                    1,
                    true
                ]
            })
        });
        const data: any = await res.json();
        if (data.result && data.result.data.length > 0) {
            lastCursor = data.result.nextCursor || null;
            console.log(`✅ SuiWatcher: Initialized cursor.`);
        }
    } catch (e) {
        console.error('❌ SuiWatcher: Failed to initialize cursor:', e);
    }

    setInterval(async () => {
        if (isRunning) return;
        isRunning = true;

        try {
            const res = await fetch(SUI_RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'sui_queryEvents',
                    params: [
                        { MoveModule: { package: PACKAGE_ID, module: 'web3' } },
                        lastCursor,
                        50,
                        false
                    ]
                })
            });

            const data: any = await res.json();
            if (data.result && data.result.data) {
                for (const event of data.result.data) {
                    if (event.type.includes('::TicketPurchased')) {
                        await handlePurchaseEvent(event);
                    }
                    lastCursor = event.id;
                }

                if (data.result.hasNextPage && data.result.nextCursor) {
                    lastCursor = data.result.nextCursor;
                }
            }

        } catch (error) {
            console.error('❌ SuiWatcher: Error polling events:', error);
        } finally {
            isRunning = false;
        }
    }, INTERVAL_MS);
};

async function handlePurchaseEvent(event: any) {
    const { book_id, buyer } = event.parsedJson;
    const digest = event.id.txDigest;

    console.log(`📖 SuiWatcher: Detected purchase for book ${book_id} by ${buyer}`);

    const db = getDB();

    // Avoid duplicates
    const existing = db.purchases.find(p => p.digest === digest);
    if (existing) return;

    db.purchases.push({
        id: `event-${Date.now()}`,
        book_id: book_id,
        wallet_address: buyer,
        digest: digest,
        created_at: new Date().toISOString()
    });

    await saveDB();
    console.log(`✅ SuiWatcher: Recorded purchase for book ${book_id} in database.`);
}
