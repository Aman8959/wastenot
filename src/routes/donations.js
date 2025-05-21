import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Get all donations
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = supabase.from('donations').select('*');

        if (status) {
            query = query.eq('status', status);
        }

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ message: 'Error fetching donations' });
    }
});

// Get single donation
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching donation:', error);
        res.status(500).json({ message: 'Error fetching donation' });
    }
});

// Create donation (requires authentication)
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            item_name,
            description,
            category,
            quantity,
            pickup_location,
            pickup_date,
            image_url,
            notes
        } = req.body;

        const { data, error } = await supabase
            .from('donations')
            .insert([
                {
                    donor_id: req.user.id,
                    item_name,
                    description,
                    category,
                    quantity,
                    pickup_location,
                    pickup_date,
                    image_url,
                    notes,
                    status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ message: 'Error creating donation' });
    }
});

// Update donation status (requires agent role)
router.patch('/:id/status', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'accepted', 'picked_up', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('donations')
            .update({
                status,
                assigned_agent_id: req.user.id,
                updated_at: new Date()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({ message: 'Error updating donation status' });
    }
});

// Get my donations (requires authentication)
router.get('/user/my-donations', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('donor_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({ message: 'Error fetching user donations' });
    }
});

// Get assigned donations (requires agent role)
router.get('/agent/assigned', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .eq('assigned_agent_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching assigned donations:', error);
        res.status(500).json({ message: 'Error fetching assigned donations' });
    }
});

export default router; 