export {};

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      username: string;
      email?: string;
      role: 'user' | 'admin' | string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}
