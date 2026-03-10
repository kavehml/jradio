import { Router } from 'express';
import { authenticateUser, createUser } from '../services/authService';
import { requireAuth, requireRole, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = await authenticateUser(email, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { user, token } = result;
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// Admin-only endpoint to create users (including radiologists and clerical staff)
router.post('/users', requireAuth, requireRole(['admin']), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await createUser({ name, email, password, role });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  const typedReq = req as AuthRequest;
  return res.json({ user: typedReq.user });
});

export default router;
