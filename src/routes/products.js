import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../config/supabaseClient.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category, search, sort } = req.query;
        let query = supabase.from('products').select('*');

        if (category) {
            query = query.eq('category', category);
        }

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        if (sort) {
            const [field, order] = sort.split(':');
            query = query.order(field, { ascending: order === 'asc' });
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
});

// Create product (requires authentication)
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name, description, price, category, stock, image_url } = req.body;

        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    name,
                    description,
                    price,
                    category,
                    stock,
                    image_url,
                    seller_id: req.user.id
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

// Update product (requires authentication and ownership)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        // Check ownership
        const { data: existingProduct } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!existingProduct || existingProduct.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this product' });
        }

        const { name, description, price, category, stock, image_url } = req.body;

        const { data, error } = await supabase
            .from('products')
            .update({
                name,
                description,
                price,
                category,
                stock,
                image_url,
                updated_at: new Date()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Delete product (requires authentication and ownership)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        // Check ownership
        const { data: existingProduct } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', req.params.id)
            .single();

        if (!existingProduct || existingProduct.seller_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this product' });
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

export default router; 