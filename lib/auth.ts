/**
 * Authentication Configuration for ThinkSpace
 * 
 * This file configures authentication using NextAuth.js with JWT tokens,
 * session management, and security features optimized for the ThinkSpace
 * PARA methodology knowledge management system.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

// JWT token interface extension
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  }
}

// Session interface extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt: Date;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  }
}

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// User validation function
const validateUser = async (email: string, password: string) => {
  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        createdAt: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Return user without password
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
};

// NextAuth configuration
export const authOptions: NextAuthOptions = {
  // Note: Not using PrismaAdapter with JWT strategy and credentials provider
  
  // Authentication providers
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Your password'
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await validateUser(credentials.email, credentials.password);
        
        if (!user) {
          throw new Error('Invalid email or password');
        }

        return user;
      },
    }),
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callback functions
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.createdAt = user.createdAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
          createdAt: token.createdAt,
        };
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle relative callback URLs
      if (url.startsWith('/')) {
        // Prevent redirect loops to auth pages
        if (url === '/signin' || url === '/signup') {
          return baseUrl;
        }
        return `${baseUrl}${url}`;
      }

      // Handle same-origin URLs
      if (new URL(url).origin === baseUrl) {
        const pathname = new URL(url).pathname;
        // Prevent redirect loops to auth pages
        if (pathname === '/signin' || pathname === '/signup') {
          return baseUrl;
        }
        return url;
      }

      // Default to base URL for external URLs
      return baseUrl;
    },
  },

  // Custom pages
  pages: {
    signIn: '/signin',
    error: '/error',
  },

  // Events
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
      
      // Update last login timestamp
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (error) {
        console.error('Error updating last login:', error);
      }
    },

    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },

  // Security settings
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',
};

// Import getServerSession for server-side usage
import { getServerSession } from 'next-auth/next';

// Helper function to get current user from session
export const getCurrentUser = async () => {
  try {
    const session = await getServerSession(authOptions);
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Role-based access control helper
export const hasRole = (user: any, requiredRole: string): boolean => {
  if (!user || !user.role) return false;

  const roleHierarchy = ['USER', 'ADMIN', 'SUPER_ADMIN'];
  const userRoleIndex = roleHierarchy.indexOf(user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
};

export { getServerSession };
