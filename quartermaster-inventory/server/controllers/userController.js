const bcrypt = require('bcrypt');
const { UserModel } = require('../models');

// Get all users (Super Admin only)
const getAllUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const users = await UserModel.findAll(filters);

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user by ID (Super Admin only)
const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new user (Super Admin only)
const createUser = async (req, res) => {
  try {
    const { username, password, full_name, rank, service_number, role, email } = req.body;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await UserModel.create({
      username,
      password_hash: passwordHash,
      full_name,
      rank,
      service_number,
      role,
      email
    });

    // Remove password hash from response
    const { password_hash, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user (Super Admin only)
const updateUser = async (req, res) => {
  try {
    const { full_name, rank, service_number, role, email, is_active } = req.body;
    const userId = req.params.id;

    const updatedUser = await UserModel.update(userId, {
      full_name,
      rank,
      service_number,
      role,
      email,
      is_active
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);

    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

// Deactivate user (Super Admin only)
const deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent super admin from deactivating themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updatedUser = await UserModel.update(userId, { is_active: false });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activate user (Super Admin only)
const activateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const updatedUser = await UserModel.update(userId, { is_active: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset user password (Super Admin only)
const resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    const userId = req.params.id;

    // Prevent super admin from resetting their own password through this endpoint
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Use the change password endpoint to change your own password' });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(new_password, saltRounds);

    // Update password
    await UserModel.updatePassword(userId, passwordHash);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user activity (Super Admin only)
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to, action, limit } = req.query;

    const filters = {
      date_from,
      date_to,
      action,
      limit: limit ? parseInt(limit) : 50
    };

    const activities = await require('../models').AuditLogModel.findByUser(id, filters);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  resetPassword,
  getUserActivity
};
