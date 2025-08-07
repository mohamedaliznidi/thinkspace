/**
 * Validation Script for Authentication Fixes
 * 
 * This script validates that the authentication routing fixes
 * have been applied correctly to prevent infinite loops.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Authentication Fixes...\n');

// Test 1: Check auth.ts configuration
console.log('1. Validating auth.ts configuration...');

const authPath = path.join(process.cwd(), 'lib/auth.ts');
const authContent = fs.readFileSync(authPath, 'utf8');

// Check signIn page configuration
const hasCorrectSignInPage = authContent.includes("signIn: '/signin'");
console.log(`   ✅ SignIn page set to '/signin': ${hasCorrectSignInPage ? 'PASS' : 'FAIL'}`);

// Check that there's no signUp page configuration
const hasSignUpPage = authContent.includes("signUp:");
console.log(`   ✅ No signUp page configuration: ${!hasSignUpPage ? 'PASS' : 'FAIL'}`);

// Check redirect callback has loop prevention
const hasRedirectLoopPrevention = authContent.includes('Prevent redirect loops');
console.log(`   ✅ Redirect loop prevention: ${hasRedirectLoopPrevention ? 'PASS' : 'FAIL'}`);

// Test 2: Check middleware.ts configuration
console.log('\n2. Validating middleware.ts configuration...');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

// Check public routes include correct auth pages
const hasSignInInPublicRoutes = middlewareContent.includes("'/signin'");
const hasSignUpInPublicRoutes = middlewareContent.includes("'/signup'");
console.log(`   ✅ SignIn in public routes: ${hasSignInInPublicRoutes ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ SignUp in public routes: ${hasSignUpInPublicRoutes ? 'PASS' : 'FAIL'}`);

// Check that middleware doesn't redirect to /dashboard for admin routes
const hasCorrectAdminRedirect = middlewareContent.includes("new URL('/', req.url)") && 
                               !middlewareContent.includes("new URL('/dashboard', req.url)");
console.log(`   ✅ Admin redirect to root: ${hasCorrectAdminRedirect ? 'PASS' : 'FAIL'}`);

// Check specific redirect logic for authenticated users
const hasSpecificAuthRedirect = middlewareContent.includes("pathname === '/signin' || pathname === '/signup'");
console.log(`   ✅ Specific auth page redirect logic: ${hasSpecificAuthRedirect ? 'PASS' : 'FAIL'}`);

// Test 3: Check signin page fixes
console.log('\n3. Validating signin page fixes...');

const signinPath = path.join(process.cwd(), 'app/(auth)/signin/page.tsx');
const signinContent = fs.readFileSync(signinPath, 'utf8');

// Check forgot password link uses correct route
const hasCorrectForgotPasswordLink = signinContent.includes('href="/forgot-password"');
const hasIncorrectForgotPasswordLink = signinContent.includes('href="/auth/forgot-password"');
console.log(`   ✅ Correct forgot password link: ${hasCorrectForgotPasswordLink ? 'PASS' : 'FAIL'}`);
console.log(`   ✅ No incorrect auth/ links: ${!hasIncorrectForgotPasswordLink ? 'PASS' : 'FAIL'}`);

// Test 4: Check that required auth pages exist
console.log('\n4. Validating auth page structure...');

const authPages = [
  'app/(auth)/signin/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/(auth)/error/page.tsx',
  'app/(auth)/forgot-password/page.tsx',
  'app/(auth)/reset-password/page.tsx'
];

authPages.forEach(pagePath => {
  const fullPath = path.join(process.cwd(), pagePath);
  const exists = fs.existsSync(fullPath);
  const pageName = path.basename(path.dirname(pagePath));
  console.log(`   ✅ ${pageName} page exists: ${exists ? 'PASS' : 'FAIL'}`);
});

// Test 5: Check route consistency
console.log('\n5. Validating route consistency...');

const allFiles = [
  'lib/auth.ts',
  'middleware.ts',
  'app/(auth)/signin/page.tsx',
  'app/(auth)/signup/page.tsx'
];

let hasInconsistentRoutes = false;
allFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for problematic /auth/ patterns (excluding API routes)
    const hasAuthPattern = content.match(/['"`]\/auth\/(signin|signup|error)['"`]/g);
    if (hasAuthPattern) {
      console.log(`   ❌ Found inconsistent auth routes in ${filePath}: ${hasAuthPattern.join(', ')}`);
      hasInconsistentRoutes = true;
    }
  }
});

if (!hasInconsistentRoutes) {
  console.log('   ✅ No inconsistent auth route patterns found: PASS');
}

// Summary
console.log('\n📊 Validation Summary:');
console.log('='.repeat(50));

const allChecks = [
  hasCorrectSignInPage,
  !hasSignUpPage,
  hasRedirectLoopPrevention,
  hasSignInInPublicRoutes,
  hasSignUpInPublicRoutes,
  hasCorrectAdminRedirect,
  hasSpecificAuthRedirect,
  hasCorrectForgotPasswordLink,
  !hasIncorrectForgotPasswordLink,
  !hasInconsistentRoutes
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('🎉 All authentication fixes have been applied successfully!');
  console.log('🔒 The infinite loop issue should now be resolved.');
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.');
}

console.log('\n🚀 Next steps:');
console.log('1. Test the authentication flow manually');
console.log('2. Verify that signin/signup redirects work correctly');
console.log('3. Ensure no infinite loops occur during authentication');
