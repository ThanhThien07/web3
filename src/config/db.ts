import fs from 'fs/promises';
import path from 'path';
import { DatabaseSchema } from '../types.js';

const DB_FILE = path.resolve('./database.json');

// Initial state
let dbData: DatabaseSchema = {
    books: [
        {
            id: 'book-1',
            title: 'Sui Move in Action',
            author: 'Mysten Labs',
            cover_url: 'https://placehold.co/400x600/png?text=Sui+Move',
            price_mist: '500000000',
            access_url: 'https://docs.sui.io/'
        },
        {
            id: 'book-2',
            title: 'Advanced Web3 Security',
            author: 'Blockchain Expert',
            cover_url: 'https://placehold.co/400x600/png?text=Web3+Sec',
            price_mist: '1000000000',
            access_url: 'https://docs.sui.io/'
        }
    ],
    purchases: [],
    users: []
};

export const connectDB = async (): Promise<void> => {
    try {
        const fileContent = await fs.readFile(DB_FILE, 'utf-8');
        dbData = JSON.parse(fileContent);
        console.log('✅ Connected to JSON database.');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('📚 Creating initial JSON database.');
            await saveDB();
        } else {
            console.error('❌ Failed to read JSON database:', error);
            process.exit(1);
        }
    }
};

export const getDB = (): DatabaseSchema => dbData;

export const saveDB = async (): Promise<void> => {
    await fs.writeFile(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
};
