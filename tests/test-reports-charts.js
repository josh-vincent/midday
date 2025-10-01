import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

// Initialize Supabase client
const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test credentials
const email = 'admin@tocld.com';
const password = 'Admin123';

async function testReportsPage() {
  console.log('🔐 Signing in...');
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Auth failed:', error.message);
    return;
  }

  console.log('✅ Authenticated successfully');

  // Launch browser
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  const page = await browser.newPage();

  // Set auth cookies
  const session = authData.session;
  await page.goto('http://localhost:3333');
  
  // Set Supabase auth cookies
  await page.evaluate((token) => {
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: token,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
  }, session);

  // Navigate to reports page
  console.log('📊 Navigating to reports page...');
  await page.goto('http://localhost:3333/reports', { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });

  // Wait for charts to load
  await page.waitForTimeout(3000);

  // Check for chart components
  console.log('🔍 Checking for chart components...');
  
  const pageTitle = await page.$eval('h1', el => el.textContent).catch(() => null);
  console.log('Page title:', pageTitle);

  // Check for chart containers
  const chartContainers = await page.$$('.grid > div');
  console.log(`Found ${chartContainers.length} chart containers`);

  // Check for any errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ Console error:', msg.text());
    }
  });

  // Take screenshot
  await page.screenshot({ path: 'reports-page.png', fullPage: true });
  console.log('📸 Screenshot saved as reports-page.png');

  // Keep browser open for inspection
  console.log('✅ Test complete. Browser will stay open for inspection.');
  console.log('Press Ctrl+C to exit.');
}

testReportsPage().catch(console.error);