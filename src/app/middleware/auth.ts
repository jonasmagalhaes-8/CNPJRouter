import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';
import type { AuthPayloadDTO } from '../dtos/AuthPayloadDTO';

export function verifyToken(request: NextRequest): AuthPayloadDTO | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayloadDTO;
  } catch {
    return null;
  }
}
