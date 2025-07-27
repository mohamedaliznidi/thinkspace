#!/usr/bin/env node

/**
 * Environment Validation Script for ThinkSpace
 * Validates that all required environment variables and dependencies are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ThinkSpace Environment Validation\n');

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
console.log(`✅ Node.js version: ${nodeVersion}`);

if (majorVersion < 18) {
  console.error('❌ Node.js 18+ is required');
  process.exit(1);
}

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.warn('⚠️  .env.local file not found. Please create it from .env.example');
} else {
  console.log('✅ .env.local file exists');
}

// Check package.json
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`✅ Project: ${packageJson.name} v${packageJson.version}`);
} else {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.warn('⚠️  node_modules not found. Run yarn install');
} else {
  console.log('✅ Dependencies installed');
}

// Check TypeScript configuration
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('✅ TypeScript configuration found');
} else {
  console.warn('⚠️  tsconfig.json not found');
}

// Check Next.js configuration
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ Next.js configuration found');
} else {
  console.warn('⚠️  next.config.js not found');
}

// Check Prisma schema
const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
if (fs.existsSync(prismaSchemaPath)) {
  console.log('✅ Prisma schema found');
} else {
  console.warn('⚠️  Prisma schema not found');
}

// Environment variables validation
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'NEXTAUTH_SECRET',
    'OPENROUTER_API_KEY'
  ];

  console.log('\n🔧 Environment Variables:');
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}="your-`)) {
      console.log(`✅ ${varName} is configured`);
    } else {
      console.warn(`⚠️  ${varName} needs to be configured`);
    }
  });
}

console.log('\n🎉 Environment validation complete!');
console.log('\nNext steps:');
console.log('1. Configure your .env.local file with actual values');
console.log('2. Set up your Neon PostgreSQL database');
console.log('3. Set up your Neo4j database');
console.log('4. Get your OpenRouter API key');
console.log('5. Run: yarn dev to start development');
