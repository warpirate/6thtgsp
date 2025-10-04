const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://ehjudngdvilwvrukcxle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoanVkbmdkdmlsd3ZydWtjeGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4NTksImV4cCI6MjA3NTEyNjg1OX0.ScklULAdDk2np6TSzLwSrISeT2k_ZeymyNr504w4iTk';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database helper functions using Supabase client
const db = {
  // Query helper
  async query(sql, params = []) {
    try {
      // For simple SELECT queries, we can use Supabase client
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        // Extract table name and conditions from SQL
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) throw error;
          return { rows: data };
        }
      }
      
      // For other queries, we'll need to use the REST API or RPC functions
      throw new Error('Complex queries not supported in this demo');
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // User authentication
  async authenticateUser(username, password) {
    try {
      // Get user by username
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !users) {
        return null;
      }
      
      // For demo purposes, we'll use a simple password check
      // In production, you should use proper password hashing
      if (users.password_hash === password) {
        return users;
      }
      
      return null;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) return null;
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
};

module.exports = {
  supabase,
  db
};
