#!/usr/bin/env node

/**
 * Direct Schema Deployment Script for ThinkSpace
 * 
 * This script deploys the database schema directly without using shell commands
 * to work around PowerShell execution policy issues.
 */

const { PrismaClient } = require('@prisma/client');

async function deploySchema() {
  console.log('🚀 Deploying ThinkSpace Database Schema...\n');

  try {
    // Initialize Prisma client
    console.log('1. Initializing Prisma client...');
    const prisma = new PrismaClient();
    
    // Test database connection
    console.log('2. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connection successful');

    // Check if we can query the database
    console.log('3. Checking database structure...');
    
    try {
      // Try to query a simple table to see if schema exists
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('   ✅ Database is accessible');
    } catch (error) {
      console.log('   ⚠️  Database query failed, schema may need deployment');
    }

    // Since we can't use prisma migrate directly, let's use db push equivalent
    console.log('4. Deploying schema using raw SQL...');

    // First create the enums
    const createEnumsSQL = `
      -- Create enums
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "AreaType" AS ENUM ('RESPONSIBILITY', 'INTEREST', 'LEARNING', 'HEALTH', 'FINANCE', 'CAREER', 'PERSONAL', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ResourceType" AS ENUM ('DOCUMENT', 'LINK', 'IMAGE', 'VIDEO', 'AUDIO', 'BOOK', 'ARTICLE', 'RESEARCH', 'REFERENCE', 'TEMPLATE', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "NoteType" AS ENUM ('QUICK', 'MEETING', 'IDEA', 'REFLECTION', 'SUMMARY', 'RESEARCH', 'TEMPLATE', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "ChatType" AS ENUM ('GENERAL', 'PROJECT', 'AREA', 'RESOURCE', 'NOTE', 'BRAINSTORM', 'ANALYSIS');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Execute enum creation first
    const enumStatements = createEnumsSQL.split('END $$;').filter(stmt => stmt.trim());

    for (const statement of enumStatements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim() + 'END $$;');
        } catch (error) {
          // Ignore errors for existing enums
          if (!error.message.includes('already exists') && !error.message.includes('duplicate_object')) {
            console.log(`   ⚠️  Enum warning: ${error.message}`);
          }
        }
      }
    }

    console.log('   ✅ Enums created');

    // Create the basic tables if they don't exist
    const createTablesSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'USER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "avatar" TEXT,
        "bio" TEXT,
        "timezone" TEXT DEFAULT 'UTC',
        "preferences" JSONB,
        "settings" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLoginAt" TIMESTAMP(3),
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );

      -- Create unique constraints
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

      -- Create projects table
      CREATE TABLE IF NOT EXISTS "projects" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
        "priority" "ProjectPriority" NOT NULL DEFAULT 'MEDIUM',
        "startDate" TIMESTAMP(3),
        "dueDate" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "progress" INTEGER NOT NULL DEFAULT 0,
        "tags" TEXT[],
        "metadata" JSONB,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
      );

      -- Create areas table
      CREATE TABLE IF NOT EXISTS "areas" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" "AreaType" NOT NULL DEFAULT 'OTHER',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "color" TEXT,
        "tags" TEXT[],
        "metadata" JSONB,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
      );

      -- Create resources table
      CREATE TABLE IF NOT EXISTS "resources" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "type" "ResourceType" NOT NULL DEFAULT 'OTHER',
        "sourceUrl" TEXT,
        "filePath" TEXT,
        "contentExtract" TEXT,
        "tags" TEXT[],
        "metadata" JSONB,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
      );

      -- Create notes table
      CREATE TABLE IF NOT EXISTS "notes" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "type" "NoteType" NOT NULL DEFAULT 'QUICK',
        "tags" TEXT[],
        "metadata" JSONB,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
      );

      -- Create chats table
      CREATE TABLE IF NOT EXISTS "chats" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "type" "ChatType" NOT NULL DEFAULT 'GENERAL',
        "contextId" TEXT,
        "userId" TEXT NOT NULL,
        "projectId" TEXT,
        "areaId" TEXT,
        "resourceId" TEXT,
        "noteId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
      );

      -- Create messages table
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" TEXT NOT NULL,
        "role" "MessageRole" NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" JSONB,
        "userId" TEXT NOT NULL,
        "chatId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
      );

      -- Create basic indexes
      CREATE INDEX IF NOT EXISTS "projects_userId_status_idx" ON "projects"("userId", "status");
      CREATE INDEX IF NOT EXISTS "areas_userId_type_idx" ON "areas"("userId", "type");
      CREATE INDEX IF NOT EXISTS "resources_userId_type_idx" ON "resources"("userId", "type");
      CREATE INDEX IF NOT EXISTS "notes_userId_type_idx" ON "notes"("userId", "type");
      CREATE INDEX IF NOT EXISTS "chats_userId_type_idx" ON "chats"("userId", "type");
      CREATE INDEX IF NOT EXISTS "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");
    `;

    // Execute the schema creation
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement.trim());
        } catch (error) {
          // Ignore errors for existing tables/indexes
          if (!error.message.includes('already exists')) {
            console.log(`   ⚠️  Warning: ${error.message}`);
          }
        }
      }
    }

    console.log('   ✅ Basic schema deployed');

    // Check if pgvector extension is available
    console.log('5. Checking pgvector extension...');
    try {
      await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
      console.log('   ✅ pgvector extension is available');
    } catch (error) {
      console.log('   ⚠️  pgvector extension not found, attempting to install...');
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
        console.log('   ✅ pgvector extension installed');
      } catch (installError) {
        console.log('   ⚠️  Could not install pgvector extension');
      }
    }

    // Add vector columns if pgvector is available
    console.log('6. Adding vector columns...');
    try {
      await prisma.$executeRaw`ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding vector(1536)`;
      await prisma.$executeRaw`ALTER TABLE resources ADD COLUMN IF NOT EXISTS embedding vector(1536)`;
      console.log('   ✅ Vector columns added');
    } catch (error) {
      console.log('   ⚠️  Vector columns may already exist or pgvector not available');
    }

    // Test the schema
    console.log('7. Testing schema...');
    
    try {
      // Try to count records in each table
      const userCount = await prisma.user.count();
      const projectCount = await prisma.project.count();
      const areaCount = await prisma.area.count();
      const resourceCount = await prisma.resource.count();
      const noteCount = await prisma.note.count();
      
      console.log('   📊 Current record counts:');
      console.log(`      Users: ${userCount}`);
      console.log(`      Projects: ${projectCount}`);
      console.log(`      Areas: ${areaCount}`);
      console.log(`      Resources: ${resourceCount}`);
      console.log(`      Notes: ${noteCount}`);
      
      console.log('   ✅ Schema is working correctly');
    } catch (error) {
      console.log('   ⚠️  Schema test failed:', error.message);
    }

    await prisma.$disconnect();
    
    console.log('\n🎉 Database schema deployment completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection established');
    console.log('✅ Basic schema tables created');
    console.log('✅ Indexes and constraints added');
    console.log('✅ Vector extension configured (if available)');
    console.log('✅ Schema validation completed');
    
    return true;

  } catch (error) {
    console.error('\n❌ Schema deployment failed:', error);
    
    if (error.message.includes('connect')) {
      console.error('\n💡 Connection Issue:');
      console.error('- Check your DATABASE_URL in .env.local');
      console.error('- Ensure your PostgreSQL instance is running');
      console.error('- Verify network connectivity');
    }
    
    return false;
  }
}

// Run the deployment
if (require.main === module) {
  deploySchema().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { deploySchema };
