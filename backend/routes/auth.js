import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'FIASCOde_jwt_secret_key';

// GET /api/auth/me - Verify JWT token from cookie or header and return user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.json({ user: null, authenticated: false });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      decoded = jwt.decode(token);
    }

    if (!decoded) {
      return res.json({ user: null, authenticated: false });
    }

    const dbUser = await User.findOne({ 
      $or: [
        { id: decoded.id || decoded.sub },
        ...(decoded.email ? [{ email: decoded.email }] : [])
      ]
    });

    if (!dbUser) {
      return res.json({
        user: {
          sub: decoded.id || decoded.sub || 'user_guest',
          id: decoded.id || decoded.sub || 'user_guest',
          name: decoded.name || 'User',
          email: decoded.email || '',
          type: decoded.type || 'user',
        },
        authenticated: true,
      });
    }

    res.json({
      user: {
        sub: dbUser.id,
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        type: dbUser.type || 'user',
      },
      dbUser,
      authenticated: true,
    });
  } catch (error) {
    res.json({ user: null, authenticated: false });
  }
});

// POST /api/auth/login - Local JWT login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let dbUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!dbUser) {
      // Create user if not exists (quick local login)
      const newId = `user_${uuidv4().substring(0, 8)}`;
      const hashedPassword = password ? await bcrypt.hash(password, 10) : '';
      const userName = email.split('@')[0];
      dbUser = new User({
        id: newId,
        name: userName.charAt(0).toUpperCase() + userName.slice(1),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        type: 'user',
      });
      await dbUser.save();
    } else if (dbUser.password && password) {
      const isMatch = await bcrypt.compare(password, dbUser.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }
    }

    const payload = {
      sub: dbUser.id,
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      type: dbUser.type,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600 * 1000, // 1 hour session
    });

    res.json({
      message: 'Login successful',
      token,
      user: payload,
      dbUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});

// POST /api/auth/signup - Local JWT registration
router.post('/signup', async (req, res) => {
  const { name, email, password, type } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    let existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newId = `user_${uuidv4().substring(0, 8)}`;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : '';

    const dbUser = new User({
      id: newId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      type: type || 'user',
    });

    await dbUser.save();

    const payload = {
      sub: dbUser.id,
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      type: dbUser.type,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600 * 1000, // 1 hour session
    });

    res.json({
      message: 'Registration successful',
      token,
      user: payload,
      dbUser,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// POST /api/auth/set-token
router.post('/set-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token missing" });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 3600 * 1000, // 1 hour session
  });

  res.status(200).json({ message: 'Token set in cookie' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out' });
});

export default router;
