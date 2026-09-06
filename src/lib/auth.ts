import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_EDIT_PASSWORD || 'upsc2027admin';
const SECRET_SALT = 'upsc-prep-engine-secure-edit-v1';

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  return password.trim() === ADMIN_PASSWORD.trim();
}

export function generateAuthToken(): string {
  const hash = crypto.createHmac('sha256', SECRET_SALT).update(ADMIN_PASSWORD).digest('hex');
  return `upsc_admin_${hash}`;
}

export function verifyAuthToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = generateAuthToken();
  return token.trim() === expected.trim();
}
