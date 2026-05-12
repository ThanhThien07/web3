export interface BookItem {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    price_mist: string;
    access_url: string;
}

export interface PurchaseRecord {
    id: string;
    book_id: string;
    username?: string;
    wallet_address: string;
    amount?: string;
    network?: string;
    digest: string;
    created_at: string;
}

export interface User {
    username: string;
    password?: string;
    wallet_address?: string;
    last_checkin?: string;
    favorites?: string[];
}

export interface DatabaseSchema {
    books: BookItem[];
    purchases: PurchaseRecord[];
    users: User[];
}
