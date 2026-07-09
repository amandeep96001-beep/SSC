import User from '../../modules/auth/user.model.js';
import { verifyToken } from '../../modules/auth/token.util.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please sign in again.'
      });
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    const user = await User.findById(payload.userId).select('_id username').lean();
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired. Please sign in again.'
      });
    }

    req.user = { id: user._id.toString(), username: user.username };
    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session. Please sign in again.'
    });
  }
}
