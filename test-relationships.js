/**
 * Test script to verify Prisma relationships are working correctly
 * Run with: node test-relationships.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRelationships() {
  try {
    console.log('🔍 Testing Prisma relationships...\n');

    // Test 1: Create a test user (if not exists)
    console.log('1. Creating/finding test user...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: 'test123'
        }
      });
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Test 2: Create a test area
    console.log('\n2. Creating test area...');
    const testArea = await prisma.area.create({
      data: {
        title: 'Test Area',
        description: 'A test area for relationship testing',
        type: 'OTHER',
        userId: testUser.id
      }
    });
    console.log('✅ Test area created:', testArea.title);

    // Test 3: Create a test project with area relationship
    console.log('\n3. Creating test project with area relationship...');
    const testProject = await prisma.project.create({
      data: {
        title: 'Test Project',
        description: 'A test project for relationship testing',
        status: 'PLANNING',
        priority: 'MEDIUM',
        userId: testUser.id,
        areas: {
          connect: { id: testArea.id }
        }
      },
      include: {
        areas: true
      }
    });
    console.log('✅ Test project created with area:', testProject.areas.length, 'area(s) connected');

    // Test 4: Create a test resource with project and area relationships
    console.log('\n4. Creating test resource with relationships...');
    const testResource = await prisma.resource.create({
      data: {
        title: 'Test Resource',
        description: 'A test resource for relationship testing',
        type: 'DOCUMENT',
        userId: testUser.id,
        projects: {
          connect: { id: testProject.id }
        },
        areas: {
          connect: { id: testArea.id }
        }
      },
      include: {
        projects: true,
        areas: true
      }
    });
    console.log('✅ Test resource created with:', testResource.projects.length, 'project(s) and', testResource.areas.length, 'area(s)');

    // Test 5: Query resources with project filter (like the API does)
    console.log('\n5. Testing resource query with project filter...');
    const resourcesWithProject = await prisma.resource.findMany({
      where: {
        userId: testUser.id,
        projects: {
          some: {
            id: testProject.id
          }
        }
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        areas: {
          select: {
            id: true,
            title: true,
            color: true
          }
        }
      }
    });
    console.log('✅ Found', resourcesWithProject.length, 'resource(s) connected to the project');

    // Test 6: Query projects with resource filter
    console.log('\n6. Testing project query with area filter...');
    const projectsWithArea = await prisma.project.findMany({
      where: {
        userId: testUser.id,
        areas: {
          some: {
            id: testArea.id
          }
        }
      },
      include: {
        areas: {
          select: {
            id: true,
            title: true,
            color: true
          }
        },
        resources: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    });
    console.log('✅ Found', projectsWithArea.length, 'project(s) connected to the area');

    // Test 7: Test count queries
    console.log('\n7. Testing count queries...');
    const resourceWithCounts = await prisma.resource.findFirst({
      where: { id: testResource.id },
      include: {
        _count: {
          select: {
            projects: true,
            areas: true,
            notes: true
          }
        }
      }
    });
    console.log('✅ Resource counts - Projects:', resourceWithCounts._count.projects, 'Areas:', resourceWithCounts._count.areas, 'Notes:', resourceWithCounts._count.notes);

    console.log('\n🎉 All relationship tests passed!');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.resource.delete({ where: { id: testResource.id } });
    await prisma.project.delete({ where: { id: testProject.id } });
    await prisma.area.delete({ where: { id: testArea.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRelationships();
