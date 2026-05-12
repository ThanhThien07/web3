import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startSuiWatcher } from './services/suiWatcher.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: '*', // For development, you can restrict this to your Netlify domain in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize DB and Start Server
const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running perfectly on http://localhost:${PORT}`);
            startSuiWatcher();
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
