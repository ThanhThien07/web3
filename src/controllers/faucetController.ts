import { Request, Response } from 'express';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { getDB, saveDB } from '../config/db.js';

export const checkin = async (req: Request, res: Response) => {
    try {
        const { username } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const db = getDB();
        const userIndex = db.users?.findIndex(u => u.username === username);

        if (userIndex === undefined || userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = db.users[userIndex];

        if (!user.wallet_address) {
            return res.status(400).json({ error: 'Please connect your SUI wallet first to check-in.' });
        }

        // Check if already checked in today
        const today = new Date().toISOString().split('T')[0];
        if (user.last_checkin === today) {
            return res.status(400).json({ error: 'You have already checked in today. Please come back tomorrow!' });
        }

        // Request SUI from Testnet Faucet
        console.log(`Requesting SUI from Testnet Faucet for ${user.wallet_address}...`);
        try {
            const result = await requestSuiFromFaucetV2({
                host: getFaucetHost('testnet'),
                recipient: user.wallet_address,
            });
            console.log('Faucet result:', result);
        } catch (faucetError: any) {
            console.error('Faucet error:', faucetError);
            return res.status(429).json({ error: 'Faucet is rate-limited or unavailable right now. Try again later.' });
        }

        // Update last_checkin
        db.users[userIndex].last_checkin = today;
        await saveDB();

        res.status(200).json({ message: 'Check-in successful! SUI is on its way to your wallet.', user: db.users[userIndex] });
    } catch (error) {
        console.error('Checkin Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
