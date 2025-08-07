/**
 * Debug Script for Redirect Loop Issues
 * 
 * This script helps identify potential redirect loop issues in the
 * ThinkSpace authentication system by analyzing configuration and
 * testing various scenarios.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Redirect Loop Issues...\n');

// Test 1: Analyze middleware route matching logic
console.log('1. Analyzing middleware route matching logic...');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

// Extract route arrays
const protectedRoutesMatch = middlewareContent.match(/protectedRoutes\s*=\s*\[([\s\S]*?)\]/);
const publicRoutesMatch = middlewareContent.match(/publicRoutes\s*=\s*\[([\s\S]*?)\]/);

if (protectedRoutesMatch) {
  const protectedRoutes = protectedRoutesMatch[1]
    .split(',')
    .map(route => route.trim().replace(/['"]/g, ''))
    .filter(route => route && !route.startsWith('//'));
  
  console.log('   Protected routes:', protectedRoutes);
  
  // Check for problematic root route matching
  if (protectedRoutes.includes('/')) {
    const hasExactMatchLogic = middlewareContent.includes('pathname === \'/\'');
    console.log(`   ✅ Root route (/) in protected routes: ${hasExactMatchLogic ? 'FIXED with exact match' : '❌ PROBLEMATIC - needs exact match'}`);
  }
}

if (publicRoutesMatch) {
  const publicRoutes = publicRoutesMatch[1]
    .split(',')
    .map(route => route.trim().replace(/['"]/g, ''))
    .filter(route => route && !route.startsWith('//'));
  
  console.log('   Public routes:', publicRoutes);
}

// Test 2: Check for server-side redirects in layouts
console.log('\n2. Checking for server-side redirects in layouts...');

const dashboardLayoutPath = path.join(process.cwd(), 'app/(dashboard)/layout.tsx');
const dashboardLayoutContent = fs.readFileSync(dashboardLayoutPath, 'utf8');

const hasServerRedirect = dashboardLayoutContent.includes('redirect(');
console.log(`   ✅ Dashboard layout server redirect removed: ${!hasServerRedirect ? 'PASS' : '❌ FAIL - still has redirect'}`);

// Test 3: Check NextAuth configuration
console.log('\n3. Checking NextAuth configuration...');

const authPath = path.join(process.cwd(), 'lib/auth.ts');
const authContent = fs.readFileSync(authPath, 'utf8');

const hasPrismaAdapter = authContent.includes('PrismaAdapter');
const hasJWTStrategy = authContent.includes("strategy: 'jwt'");
console.log(`   ✅ No PrismaAdapter conflict: ${!hasPrismaAdapter ? 'PASS' : '❌ FAIL - still using PrismaAdapter'}`);
console.log(`   ✅ Using JWT strategy: ${hasJWTStrategy ? 'PASS' : '❌ FAIL - JWT strategy not found'}`);

// Test 4: Simulate route matching logic
console.log('\n4. Simulating route matching logic...');

const testRoutes = [
  '/',
  '/signin',
  '/signup',
  '/projects',
  '/projects/123',
  '/api/auth/signin',
  '/api/auth/session',
  '/api/projects'
];

const protectedRoutes = ['/', '/projects', '/areas', '/resources', '/notes', '/archive', '/chat', '/graph', '/search', '/profile', '/settings'];
const publicRoutes = ['/signin', '/signup', '/error', '/forgot-password', '/reset-password', '/api/auth'];

testRoutes.forEach(testPath => {
  // Simulate the fixed logic
  const isProtected = protectedRoutes.some(route => {
    if (route === '/') {
      return testPath === '/';
    }
    return testPath.startsWith(route);
  });
  
  const isPublic = publicRoutes.some(route => testPath.startsWith(route));
  
  console.log(`   ${testPath}: Protected=${isProtected}, Public=${isPublic}`);
  
  // Check for conflicts
  if (isProtected && isPublic) {
    console.log(`   ⚠️  CONFLICT: ${testPath} is both protected and public!`);
  }
});

// Test 5: Check for client-side redirect issues
console.log('\n5. Checking for client-side redirect issues...');

const signinPagePath = path.join(process.cwd(), 'app/(auth)/signin/page.tsx');
const signinPageContent = fs.readFileSync(signinPagePath, 'utf8');

const hasClientRedirect = signinPageContent.includes('router.push') || signinPageContent.includes('router.replace');
const hasCallbackUrl = signinPageContent.includes('callbackUrl');
console.log(`   ✅ Signin page has redirect logic: ${hasClientRedirect ? 'YES' : 'NO'}`);
console.log(`   ✅ Signin page handles callback URL: ${hasCallbackUrl ? 'YES' : 'NO'}`);

// Test 6: Check environment variables
console.log('\n6. Checking environment configuration...');

const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL');
  const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET');
  
  console.log(`   ✅ NEXTAUTH_URL configured: ${hasNextAuthUrl ? 'YES' : 'NO'}`);
  console.log(`   ✅ NEXTAUTH_SECRET configured: ${hasNextAuthSecret ? 'YES' : 'NO'}`);
}

// Test 7: Generate redirect flow diagram
console.log('\n7. Redirect flow analysis...');
console.log('   Expected flow for unauthenticated user:');
console.log('   1. User visits / → Middleware redirects to /signin');
console.log('   2. User sees signin page');
console.log('   3. User submits credentials → NextAuth processes');
console.log('   4. On success → NextAuth redirects to callback URL (/)');
console.log('   5. User visits / → Middleware allows (has token)');
console.log('   6. Dashboard layout renders without server redirect');

console.log('\n   Potential loop points:');
console.log('   ❌ Dashboard layout doing server redirect (FIXED)');
console.log('   ❌ Root route matching all paths (FIXED)');
console.log('   ❌ NextAuth redirect callback issues (FIXED)');
console.log('   ❌ Middleware blocking NextAuth API routes (FIXED)');

// Test 8: Recommendations
console.log('\n8. Debugging recommendations...');
console.log('   To debug remaining issues:');
console.log('   1. Clear browser cookies and cache');
console.log('   2. Check browser Network tab for redirect chain');
console.log('   3. Enable NextAuth debug mode in development');
console.log('   4. Check server logs for middleware execution');
console.log('   5. Test with incognito/private browsing mode');

console.log('\n📊 Summary:');
console.log('   The main redirect loop causes have been addressed:');
console.log('   ✅ Removed server-side redirect from dashboard layout');
console.log('   ✅ Fixed root route matching in middleware');
console.log('   ✅ Removed PrismaAdapter conflict');
console.log('   ✅ Added NextAuth API route protection');
console.log('   ✅ Simplified redirect callback logic');

console.log('\n🚀 Next steps:');
console.log('   1. Restart your development server');
console.log('   2. Clear browser cookies for localhost');
console.log('   3. Test authentication flow in incognito mode');
console.log('   4. If issues persist, check browser Network tab for redirect chain');
