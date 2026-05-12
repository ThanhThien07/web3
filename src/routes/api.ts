import express, { Router } from 'express';
import { getBooks } from '../controllers/bookController.js';
import { verifyPurchase, getPurchases } from '../controllers/purchaseController.js';
import { register, login, updateWallet } from '../controllers/authController.js';
import { checkin } from '../controllers/faucetController.js';
import { toggleFavorite, getFavorites } from '../controllers/favoritesController.js';

const router: Router = express.Router();

router.get('/books', getBooks);
router.post('/verify-purchase', verifyPurchase);
router.get('/purchases', getPurchases);

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/wallet', updateWallet);

router.post('/favorites/toggle', toggleFavorite);
router.get('/favorites', getFavorites);

router.post('/faucet/checkin', checkin);

export default router;
