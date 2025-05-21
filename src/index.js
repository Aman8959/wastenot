import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireRole } from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import productsRouter from './routes/products.js';
import donationsRouter from './routes/donations.js';
import agentsRouter from './routes/agents.js';

// Load environment variables
dotenv.config();

const app = express();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-url.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API routes
app.use('/api/products', productsRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/agents', agentsRouter);

// Protected routes example
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Agent-only route example
app.get('/api/agent/dashboard', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('assigned_agent_id', req.user.id);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Agent dashboard error:', error);
        res.status(500).json({ message: 'Error fetching agent dashboard' });
    }
});

// Database test route
app.get('/api/test', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Database connection successful!',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
    console.log(`API Documentation available at: http://localhost:${PORT}/api`);
}); 