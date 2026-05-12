import { Request, Response, NextFunction } from 'express';
import { getDB } from '../config/db.js';

export const getBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const db = getDB();
        let books = db.books;

        const queryStr = req.query.q as string | undefined;
        if (queryStr) {
            const search = queryStr.toLowerCase();
            books = books.filter(b => b.title.toLowerCase().includes(search));
        }

        res.json({ items: books });
    } catch (error) {
        next(error);
    }
};
