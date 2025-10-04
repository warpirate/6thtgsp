const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { config } = require('../config/database');
const { supabase } = require('../config/supabase');

// Login controller using Supabase
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔍 Attempting login for username:', username);

    // Find user by username using Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ User found:', user.username);

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account disabled');
      return res.status(401).json({ error: 'User account is disabled' });
    }

    // For demo purposes, let's use a simple password check
    // In production, you should use proper password hashing
    if (password === 'Admin@123') {
      console.log('✅ Password verified');
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      console.log('✅ Login successful, token generated');

      // Return user data and token
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          rank: user.rank,
          service_number: user.service_number,
          role: user.role,
          email: user.email,
          last_login: user.last_login
        }
      });
    } else {
      console.log('❌ Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout controller
const logout = async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user info
const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      rank: user.rank,
      service_number: user.service_number,
      role: user.role,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  logout,
  getMe
};
