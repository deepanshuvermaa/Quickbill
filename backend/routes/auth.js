const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Joi = require('joi');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  businessName: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, email, phone, businessName, password } = value;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (name, email, phone, business_name, password_hash, is_email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, phone, business_name, is_email_verified, created_at`,
      [name, email, phone, businessName, hashedPassword, false]
    );

    const user = userResult.rows[0];

    // Create trial subscription
    const subscriptionResult = await pool.query(
      `INSERT INTO user_subscriptions (user_id, plan, status, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW())
       RETURNING id, plan, status, start_date, end_date`,
      [user.id, 'trial', 'active']
    );

    const subscription = subscriptionResult.rows[0];

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Calculate days remaining
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessName: user.business_name,
          isEmailVerified: user.is_email_verified,
          createdAt: user.created_at
        },
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date,
          isInGracePeriod: false,
          daysRemaining: Math.max(0, daysRemaining)
        },
        token,
        refreshToken
      }
    });

    // TODO: Send welcome email with verification link

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Find user
    const userResult = await pool.query(
      'SELECT id, name, email, phone, business_name, password_hash, is_email_verified, created_at FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get active subscription
    const subscriptionResult = await pool.query(
      `SELECT id, plan, status, start_date, end_date, grace_period_end
       FROM user_subscriptions 
       WHERE user_id = $1 AND status IN ('active', 'expired')
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    let subscription = null;
    if (subscriptionResult.rows.length > 0) {
      const sub = subscriptionResult.rows[0];
      const endDate = new Date(sub.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      
      subscription = {
        id: sub.id,
        plan: sub.plan,
        status: sub.status,
        startDate: sub.start_date,
        endDate: sub.end_date,
        gracePeriodEnd: sub.grace_period_end,
        isInGracePeriod: sub.grace_period_end && new Date() <= new Date(sub.grace_period_end),
        daysRemaining: Math.max(0, daysRemaining)
      };
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          businessName: user.business_name,
          isEmailVerified: user.is_email_verified,
          createdAt: user.created_at
        },
        subscription,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new tokens
    const newToken = generateToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

module.exports = router;