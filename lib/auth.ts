import { NextRequest } from 'next/server';

// Simple MVP auth - just check admin secret
export function verifyAdminAccess(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_DOWNLOAD_SECRET;
}