import { Request, Response } from 'express';
import { getDB, saveDB } from '../config/db.js';

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, wallet_address } = req.body;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const db = getDB();
        
        // Check if exists
        if (db.users && db.users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            username,
            password,
            wallet_address
        };

        if (!db.users) db.users = [];
        db.users.push(newUser);
        await saveDB();

        res.status(201).json({ message: 'User registered successfully', user: { username, wallet_address } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        
        const db = getDB();
        const user = db.users?.find(u => u.username === username);

        if (!user || (user.password && user.password !== password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user: { username: user.username, wallet_address: user.wallet_address } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateWallet = async (req: Request, res: Response) => {
    try {
        const { username, wallet_address } = req.body;
        const db = getDB();
        const userIndex = db.users?.findIndex(u => u.username === username);

        if (userIndex === undefined || userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        db.users[userIndex].wallet_address = wallet_address;
        await saveDB();

        res.status(200).json({ message: 'Wallet updated successfully', user: db.users[userIndex] });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
