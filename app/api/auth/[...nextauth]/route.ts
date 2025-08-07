/**
 * NextAuth.js API Route Handler for ThinkSpace
 * 
 * This file configures NextAuth.js authentication for the ThinkSpace
 * PARA methodology knowledge management system with JWT tokens,
 * Prisma adapter, and custom authentication logic.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Create NextAuth handler
const handler = NextAuth(authOptions);

// Export handler for both GET and POST requests
export { handler as GET, handler as POST };
