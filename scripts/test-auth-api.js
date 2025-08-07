/**
 * Test Script for NextAuth API Endpoints
 * 
 * This script tests the NextAuth API endpoints to ensure they're working
 * correctly and not causing 302 redirect loops.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 3000),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'NextAuth-Test-Script/1.0',
        'Accept': 'application/json, text/html',
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testAuthEndpoints() {
  console.log('🔍 Testing NextAuth API Endpoints...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const endpoints = [
    '/api/auth/signin',
    '/api/auth/session',
    '/api/auth/providers',
    '/api/auth/csrf'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      
      console.log(`  Status: ${response.statusCode}`);
      
      if (response.statusCode === 302) {
        console.log(`  Redirect to: ${response.headers.location || 'No location header'}`);
        
        // Check if it's a problematic redirect loop
        if (response.headers.location && response.headers.location.includes('/api/auth/signin')) {
          console.log(`  ⚠️  Potential redirect loop detected!`);
        } else {
          console.log(`  ✅ Normal redirect (not a loop)`);
        }
      } else if (response.statusCode === 200) {
        console.log(`  ✅ Success`);
        
        // For JSON endpoints, try to parse the response
        if (endpoint.includes('session') || endpoint.includes('providers') || endpoint.includes('csrf')) {
          try {
            const jsonData = JSON.parse(response.data);
            console.log(`  Data keys: ${Object.keys(jsonData).join(', ')}`);
          } catch (e) {
            console.log(`  Response length: ${response.data.length} chars`);
          }
        }
      } else {
        console.log(`  ❌ Unexpected status code`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log('');
    }
  }
}

async function testSignInPage() {
  console.log('🔍 Testing Sign In Page...\n');
  
  try {
    const response = await makeRequest(`${BASE_URL}/signin`);
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Sign in page loads successfully');
      
      // Check if the page contains expected elements
      if (response.data.includes('Sign in') || response.data.includes('signin')) {
        console.log('✅ Page contains sign in content');
      } else {
        console.log('⚠️  Page may not contain expected sign in content');
      }
    } else if (response.statusCode === 302) {
      console.log(`Redirect to: ${response.headers.location || 'No location header'}`);
      console.log('⚠️  Sign in page is redirecting (may indicate auth loop)');
    } else {
      console.log('❌ Unexpected response from sign in page');
    }
  } catch (error) {
    console.log(`❌ Error testing sign in page: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  console.log('🚀 NextAuth API Test Suite');
  console.log('=' .repeat(50));
  console.log('');
  
  // Test the sign in page first
  await testSignInPage();
  
  // Test API endpoints
  await testAuthEndpoints();
  
  console.log('📊 Test Summary:');
  console.log('- If /api/auth/signin returns 302 to a sign in page, that\'s normal');
  console.log('- If it redirects to itself, that indicates a loop');
  console.log('- /api/auth/session should return 200 with session data or null');
  console.log('- /api/auth/providers should return 200 with provider list');
  console.log('- /api/auth/csrf should return 200 with CSRF token');
  console.log('');
  console.log('💡 If you see redirect loops, check:');
  console.log('1. NEXTAUTH_SECRET is set in environment variables');
  console.log('2. NEXTAUTH_URL matches your development URL');
  console.log('3. No conflicting middleware rules');
  console.log('4. NextAuth configuration is correct');
}

// Run the tests
main().catch(console.error);
