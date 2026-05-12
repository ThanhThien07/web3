import { Request, Response, NextFunction } from 'express';
import { getDB, saveDB } from '../config/db.js';
import { SuiService } from '../services/suiService.js';

export const verifyPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { bookId, walletAddress, digest, username, amount, network = 'testnet' } = req.body;

    // Validation
    if (!bookId || !walletAddress || !digest || !username) {
        res.status(400).json({ error: 'Missing required fields (bookId, walletAddress, digest, username)' });
        return;
    }

    try {
        const db = getDB();

        // 1. Check for duplicate transaction
        const isDuplicate = db.purchases.some(p => p.digest === digest);
        if (isDuplicate) {
            res.status(400).json({ error: 'Transaction digest has already been processed' });
            return;
        }

        // 2. Verify on-chain status
        const isSuccess = await SuiService.verifyTransactionStatus(digest, network);
        if (!isSuccess) {
            res.status(400).json({ error: 'Transaction failed or is not successful on-chain' });
            return;
        }

        // 3. Find the book
        const book = db.books.find(b => b.id === bookId);
        if (!book) {
            res.status(404).json({ error: 'Book not found in our catalog' });
            return;
        }

        // 4. Save record
        const newPurchase = {
            id: `purchase-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            book_id: bookId,
            username,
            wallet_address: walletAddress,
            amount: amount || (Number(book.price_mist) / 1000000000).toString(),
            network,
            digest,
            created_at: new Date().toISOString()
        };

        db.purchases.push(newPurchase);
        await saveDB();

        res.status(201).json({
            fulfilled: true,
            accessUrl: book.access_url,
            purchase: newPurchase,
            message: 'Payment verified! You now have permanent access to this book.'
        });

    } catch (error: any) {
        console.error('[VerifyPurchase Error]:', error);
        const status = error.message?.includes('not found') ? 404 : 400;
        res.status(status).json({ error: error.message || 'Blockchain verification failed' });
    }
};

export const getPurchases = async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const db = getDB();
        const userPurchases = db.purchases.filter(p => p.username === username);

        // Map with book titles for the frontend
        const history = userPurchases.map(p => {
            const book = db.books.find(b => b.id === p.book_id);
            return {
                ...p,
                book_title: book ? book.title : 'Unknown Book'
            };
        });

        res.json(history.reverse());
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
