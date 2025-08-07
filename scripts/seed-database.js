#!/usr/bin/env node

/**
 * Direct Database Seeding Script for ThinkSpace
 * 
 * This script seeds the database with sample data without using external commands
 * to work around PowerShell execution policy issues.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simple password hashing function
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabase() {
  console.log('🌱 Seeding ThinkSpace Database...\n');

  try {
    // Create demo user
    console.log('1. Creating demo user...');
    
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@thinkspace.com' },
      update: {},
      create: {
        id: 'demo-user-id',
        email: 'demo@thinkspace.com',
        name: 'Demo User',
        password: hashPassword('demo123'),
        role: 'USER',
        bio: 'Demo user for ThinkSpace PARA methodology system',
        timezone: 'UTC',
        preferences: {
          theme: 'light',
          notifications: true,
          autoSave: true,
        },
        settings: {
          defaultView: 'dashboard',
          sidebarCollapsed: false,
        },
      },
    });

    console.log(`   ✅ Demo user created: ${demoUser.email}`);

    // Create sample areas
    console.log('\n2. Creating sample areas...');
    
    const areas = [
      {
        id: 'area-personal-dev',
        title: 'Personal Development',
        description: 'Continuous learning and self-improvement activities',
        type: 'LEARNING',
        color: '#3B82F6',
        tags: ['learning', 'growth', 'skills'],
        userId: demoUser.id,
      },
      {
        id: 'area-health-fitness',
        title: 'Health & Fitness',
        description: 'Physical and mental health maintenance',
        type: 'HEALTH',
        color: '#10B981',
        tags: ['health', 'fitness', 'wellness'],
        userId: demoUser.id,
      },
      {
        id: 'area-career-dev',
        title: 'Career Development',
        description: 'Professional growth and career advancement',
        type: 'CAREER',
        color: '#8B5CF6',
        tags: ['career', 'professional', 'networking'],
        userId: demoUser.id,
      },
      {
        id: 'area-finance',
        title: 'Financial Management',
        description: 'Personal finance and investment tracking',
        type: 'FINANCE',
        color: '#F59E0B',
        tags: ['finance', 'investment', 'budgeting'],
        userId: demoUser.id,
      },
    ];

    const createdAreas = [];
    for (const areaData of areas) {
      const area = await prisma.area.upsert({
        where: { id: areaData.id },
        update: areaData,
        create: areaData,
      });
      createdAreas.push(area);
      console.log(`   ✅ Area created: ${area.title}`);
    }

    // Create sample projects
    console.log('\n3. Creating sample projects...');
    
    const projects = [
      {
        id: 'project-typescript',
        title: 'Learn TypeScript Advanced Patterns',
        description: 'Master advanced TypeScript patterns and best practices for better code quality',
        status: 'ACTIVE',
        priority: 'HIGH',
        progress: 65,
        startDate: new Date('2024-01-01'),
        dueDate: new Date('2024-03-31'),
        tags: ['typescript', 'learning', 'programming'],
        userId: demoUser.id,
      },
      {
        id: 'project-finance-dashboard',
        title: 'Build Personal Finance Dashboard',
        description: 'Create a comprehensive dashboard to track expenses, investments, and financial goals',
        status: 'PLANNING',
        priority: 'MEDIUM',
        progress: 20,
        startDate: new Date('2024-02-01'),
        dueDate: new Date('2024-05-31'),
        tags: ['finance', 'dashboard', 'project'],
        userId: demoUser.id,
      },
      {
        id: 'project-marathon',
        title: 'Complete Marathon Training',
        description: '16-week marathon training program preparation for city marathon',
        status: 'ACTIVE',
        priority: 'HIGH',
        progress: 45,
        startDate: new Date('2024-01-15'),
        dueDate: new Date('2024-06-15'),
        tags: ['marathon', 'training', 'fitness'],
        userId: demoUser.id,
      },
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const project = await prisma.project.upsert({
        where: { id: projectData.id },
        update: projectData,
        create: projectData,
      });
      createdProjects.push(project);
      console.log(`   ✅ Project created: ${project.title}`);
    }

    // Create sample resources
    console.log('\n4. Creating sample resources...');
    
    const resources = [
      {
        id: 'resource-ts-handbook',
        title: 'TypeScript Handbook',
        description: 'Official TypeScript documentation and best practices guide',
        type: 'REFERENCE',
        sourceUrl: 'https://www.typescriptlang.org/docs/',
        contentExtract: 'TypeScript is a strongly typed programming language that builds on JavaScript...',
        tags: ['typescript', 'documentation', 'reference'],
        userId: demoUser.id,
      },
      {
        id: 'resource-finance-template',
        title: 'Personal Finance Spreadsheet Template',
        description: 'Comprehensive Excel template for tracking personal finances',
        type: 'TEMPLATE',
        contentExtract: 'Monthly budget tracker with categories for income, expenses, and savings goals...',
        tags: ['finance', 'template', 'budgeting'],
        userId: demoUser.id,
      },
      {
        id: 'resource-marathon-plan',
        title: 'Marathon Training Plan PDF',
        description: '16-week progressive training plan for first-time marathoners',
        type: 'DOCUMENT',
        contentExtract: 'Week 1-4: Base building phase with easy runs and gradual mileage increase...',
        tags: ['marathon', 'training', 'plan'],
        userId: demoUser.id,
      },
    ];

    const createdResources = [];
    for (const resourceData of resources) {
      const resource = await prisma.resource.upsert({
        where: { id: resourceData.id },
        update: resourceData,
        create: resourceData,
      });
      createdResources.push(resource);
      console.log(`   ✅ Resource created: ${resource.title}`);
    }

    // Create sample notes
    console.log('\n5. Creating sample notes...');
    
    const notes = [
      {
        id: 'note-ts-generics',
        title: 'TypeScript Generic Constraints',
        content: `# Generic Constraints in TypeScript

Key concepts learned today:
- Using 'extends' keyword to constrain generic types
- Conditional types with generic constraints
- Mapped types and their constraints

Example:
\`\`\`typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

This ensures type safety when accessing object properties.`,
        type: 'RESEARCH',
        tags: ['typescript', 'generics', 'learning'],
        userId: demoUser.id,
      },
      {
        id: 'note-training-log',
        title: 'Weekly Training Log - Week 8',
        content: `# Marathon Training - Week 8

## This Week's Summary
- Total miles: 42
- Long run: 16 miles
- Pace improvement: 15 seconds per mile
- Recovery: Good, no injuries

## Key Observations
- Feeling stronger on hills
- Need to focus more on hydration during long runs
- Consider new running shoes next month

## Next Week Goals
- Increase long run to 18 miles
- Add one more tempo run
- Schedule sports massage`,
        type: 'SUMMARY',
        tags: ['marathon', 'training', 'log'],
        userId: demoUser.id,
      },
      {
        id: 'note-investment-research',
        title: 'Investment Research Notes',
        content: `# Q1 Investment Research

## Market Analysis
- Tech sector showing resilience
- Interest rates stabilizing
- Inflation trending downward

## Potential Investments
1. **Index Funds**: Low-cost, diversified option
2. **Tech ETFs**: Higher risk, higher potential return
3. **Bonds**: Stable income, lower risk

## Action Items
- [ ] Research Vanguard S&P 500 ETF
- [ ] Compare expense ratios
- [ ] Set up automatic monthly investment
- [ ] Review portfolio allocation quarterly`,
        type: 'RESEARCH',
        tags: ['investment', 'research', 'finance'],
        userId: demoUser.id,
      },
    ];

    for (const noteData of notes) {
      const note = await prisma.note.upsert({
        where: { id: noteData.id },
        update: noteData,
        create: noteData,
      });
      console.log(`   ✅ Note created: ${note.title}`);
    }

    // Create sample chat
    console.log('\n6. Creating sample chat...');
    
    const chat = await prisma.chat.upsert({
      where: { id: 'chat-typescript-help' },
      update: {},
      create: {
        id: 'chat-typescript-help',
        title: 'TypeScript Learning Discussion',
        type: 'PROJECT',
        userId: demoUser.id,
        projectId: createdProjects[0].id,
      },
    });

    // Create sample messages
    const messages = [
      {
        id: 'msg-user-question',
        role: 'USER',
        content: 'I need help understanding TypeScript generic constraints. Can you explain with examples?',
        userId: demoUser.id,
        chatId: chat.id,
      },
      {
        id: 'msg-assistant-response',
        role: 'ASSISTANT',
        content: `Generic constraints in TypeScript allow you to limit the types that can be used with generics. Here's a practical example:

\`\`\`typescript
// Without constraints - too permissive
function getValue<T>(obj: T, key: string) {
  return obj[key]; // Error: Element implicitly has 'any' type
}

// With constraints - type safe
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // ✅ Type safe!
}
\`\`\`

The \`K extends keyof T\` constraint ensures that \`key\` is actually a property of \`obj\`.`,
        userId: demoUser.id,
        chatId: chat.id,
      },
    ];

    for (const messageData of messages) {
      await prisma.message.upsert({
        where: { id: messageData.id },
        update: messageData,
        create: messageData,
      });
    }

    console.log(`   ✅ Chat created: ${chat.title} with ${messages.length} messages`);

    // Get final statistics
    console.log('\n7. Getting final statistics...');
    
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const areaCount = await prisma.area.count();
    const resourceCount = await prisma.resource.count();
    const noteCount = await prisma.note.count();
    const chatCount = await prisma.chat.count();
    const messageCount = await prisma.message.count();

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${userCount} users created`);
    console.log(`   - ${areaCount} areas created`);
    console.log(`   - ${projectCount} projects created`);
    console.log(`   - ${resourceCount} resources created`);
    console.log(`   - ${noteCount} notes created`);
    console.log(`   - ${chatCount} chats with ${messageCount} messages created`);

    console.log('\n🚀 Ready to explore ThinkSpace with sample data!');
    console.log('   Login with: demo@thinkspace.com / demo123');

    return true;

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { seedDatabase };
