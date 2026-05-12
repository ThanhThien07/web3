import { Request, Response } from 'express';
import { getDB, saveDB } from '../config/db.js';

export const toggleFavorite = async (req: Request, res: Response) => {
    try {
        const { username, bookId } = req.body;
        if (!username || !bookId) {
            return res.status(400).json({ error: 'Username and bookId are required' });
        }

        const db = getDB();
        const userIndex = db.users?.findIndex(u => u.username === username);

        if (userIndex === undefined || userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = db.users[userIndex];
        if (!user.favorites) {
            user.favorites = [];
        }

        const favIndex = user.favorites.indexOf(bookId);
        let message = '';

        if (favIndex === -1) {
            user.favorites.push(bookId);
            message = 'Đã thêm vào danh sách yêu thích';
        } else {
            user.favorites.splice(favIndex, 1);
            message = 'Đã xóa khỏi danh sách yêu thích';
        }

        saveDB();
        res.json({ message, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getFavorites = async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const db = getDB();
        const user = db.users?.find(u => u.username === username);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const favoriteBooks = db.books.filter(book => user.favorites?.includes(book.id));
        res.json(favoriteBooks);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
