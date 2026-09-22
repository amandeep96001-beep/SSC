import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  register = asyncHandler(async (req, res) => {
    const result = await this.authService.register(req.body);
    return created(res, { message: result.message, data: result.data });
  });

  login = asyncHandler(async (req, res) => {
    const result = await this.authService.login(req.body);
    if (!result.session) {
      return ok(res, { message: result.message, data: result.data });
    }
    return ok(res, { data: result.data });
  });

  getMe = asyncHandler(async (req, res) => {
    const include = String(req.query.include || '');
    const includeAvatar = include.split(',').map((s) => s.trim()).includes('avatar');
    const data = await this.authService.getMe(
      req.user!.id,
      req.user!.username,
      { email: req.user!.email, role: req.user!.role },
      { includeAvatar },
    );
    return ok(res, { data });
  });

  logout = asyncHandler(async (req, res) => {
    const result = await this.authService.logout(req.user!.id);
    return ok(res, { message: result.message });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const data = await this.authService.updateProfile(
      req.user!.id,
      req.user!.username,
      req.body || {},
    );
    return ok(res, { message: 'Profile updated.', data });
  });

  loginWithGoogle = asyncHandler(async (req, res) => {
    const result = await this.authService.loginWithGoogle(req.body || {});
    return ok(res, { data: result.data });
  });
}

export const authController = new AuthController();
