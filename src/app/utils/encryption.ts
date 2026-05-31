import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'cnpjbi-encryption-key-32bytes!!';

function getKeyBuffer(): Buffer {
  return crypto.scryptSync(ENCRYPTION_KEY, 'cnpjbi-salt', 32);
}

export function encrypt(text: string): string {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string | null {
  try {
    const key = getKeyBuffer();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return null;
  }
}

// Aliases used by other routes
export function encryptPayload(data: any): string {
  return encrypt(JSON.stringify(data));
}

export function decryptPayload(encryptedText: string): any {
  const text = decrypt(encryptedText);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
