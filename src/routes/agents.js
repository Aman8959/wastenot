import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Get all agents (public)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone
                )
            `)
            .eq('verification_status', 'verified');

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ message: 'Error fetching agents' });
    }
});

// Get single agent (public)
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .select(`
                *,
                users:user_id (
                    full_name,
                    email,
                    phone
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ message: 'Error fetching agent' });
    }
});

// Register as agent (requires authentication)
router.post('/register', requireAuth, async (req, res) => {
    try {
        const { area_of_operation, vehicle_type } = req.body;

        // Check if user is already an agent
        const { data: existingAgent } = await supabase
            .from('agents')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        if (existingAgent) {
            return res.status(400).json({ message: 'User is already registered as an agent' });
        }

        const { data, error } = await supabase
            .from('agents')
            .insert([
                {
                    user_id: req.user.id,
                    area_of_operation,
                    vehicle_type,
                    verification_status: 'pending'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error registering agent:', error);
        res.status(500).json({ message: 'Error registering agent' });
    }
});

// Update agent profile (requires authentication and agent role)
router.put('/profile', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { area_of_operation, vehicle_type, availability_status } = req.body;

        const { data, error } = await supabase
            .from('agents')
            .update({
                area_of_operation,
                vehicle_type,
                availability_status,
                updated_at: new Date()
            })
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating agent profile:', error);
        res.status(500).json({ message: 'Error updating agent profile' });
    }
});

// Get agent statistics (requires authentication and agent role)
router.get('/stats/me', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .select('rating, total_pickups')
            .eq('user_id', req.user.id)
            .single();

        if (agentError) throw agentError;

        const { data: recentDonations, error: donationsError } = await supabase
            .from('donations')
            .select('*')
            .eq('assigned_agent_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (donationsError) throw donationsError;

        res.json({
            stats: agent,
            recent_donations: recentDonations
        });
    } catch (error) {
        console.error('Error fetching agent statistics:', error);
        res.status(500).json({ message: 'Error fetching agent statistics' });
    }
});

// Update agent availability (requires authentication and agent role)
router.patch('/availability', requireAuth, requireRole(['agent']), async (req, res) => {
    try {
        const { availability_status } = req.body;
        const validStatuses = ['available', 'busy', 'offline'];

        if (!validStatuses.includes(availability_status)) {
            return res.status(400).json({ message: 'Invalid availability status' });
        }

        const { data, error } = await supabase
            .from('agents')
            .update({ availability_status })
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ message: 'Error updating availability' });
    }
});

export default router; 