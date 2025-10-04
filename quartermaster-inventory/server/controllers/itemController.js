const { ItemModel } = require('../models');

// Get all items with optional filters
const getAllItems = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      search: req.query.search,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const items = await ItemModel.findAll(filters);

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const item = await ItemModel.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new item (Admin and Super Admin only)
const createItem = async (req, res) => {
  try {
    const { item_code, nomenclature, category, unit_of_measure, description } = req.body;

    // Check if item code already exists
    const existingItem = await ItemModel.findByCode(item_code);
    if (existingItem) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const newItem = await ItemModel.create({
      item_code,
      nomenclature,
      category,
      unit_of_measure,
      description,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    });
  } catch (error) {
    console.error('Create item error:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Item code already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update item (Admin and Super Admin only)
const updateItem = async (req, res) => {
  try {
    const { item_code, nomenclature, category, unit_of_measure, description, is_active } = req.body;
    const itemId = req.params.id;

    // Check if item code already exists (excluding current item)
    const existingItem = await ItemModel.findByCode(item_code);
    if (existingItem && existingItem.id !== itemId) {
      return res.status(400).json({ error: 'Item code already exists' });
    }

    const updatedItem = await ItemModel.update(itemId, {
      item_code,
      nomenclature,
      category,
      unit_of_measure,
      description,
      is_active
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Item code already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get items by category
const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const items = await ItemModel.findAll({
      category,
      is_active: true
    });

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Get items by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search items
const searchItems = async (req, res) => {
  try {
    const { q: query, category, limit } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const items = await ItemModel.findAll({
      search: query,
      category,
      is_active: true,
      limit: limit ? parseInt(limit) : 50
    });

    res.json({
      success: true,
      data: items,
      count: items.length,
      query
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get item statistics
const getItemStats = async (req, res) => {
  try {
    const pool = require('../config/database').pool;

    // Get category-wise item counts
    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM items_master
      WHERE is_active = true
      GROUP BY category
      ORDER BY category
    `);

    // Get total items count
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM items_master WHERE is_active = true'
    );

    // Get recent items (last 30 days)
    const recentResult = await pool.query(`
      SELECT COUNT(*) as recent_count
      FROM items_master
      WHERE is_active = true
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    res.json({
      success: true,
      data: {
        total_items: parseInt(totalResult.rows[0].total),
        recent_items: parseInt(recentResult.rows[0].recent_count),
        category_breakdown: categoryStats.rows.map(row => ({
          category: row.category,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get item stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  getItemsByCategory,
  searchItems,
  getItemStats
};
