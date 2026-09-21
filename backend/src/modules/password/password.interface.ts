export interface PasswordResetVerifyData {
  email: string;
  verified: true;
  resetToken: string;
  resetUrl: string;
  expiresIn: number;
}
