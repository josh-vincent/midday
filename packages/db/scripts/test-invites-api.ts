import { config as loadEnv } from "dotenv";
import path from "path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

async function testInvitesEndpoint() {
  try {
    console.log('\n🔍 Testing team.invitesByEmail endpoint...\n');
    
    // Login first to get access token
    const loginResponse = await fetch('https://ulncfblvuijlgniydjju.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk1MzQ3MDAsImV4cCI6MjAzNTExMDcwMH0.QvWzSDCNTm3M5MJrT8TBKDiCJHLuVXa4cHHjq3XNHH4',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@tocld.com',
        password: 'Admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      process.exit(1);
    }
    
    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;
    
    console.log('✅ Logged in successfully');
    console.log('User ID:', loginData.user.id);
    console.log('Email:', loginData.user.email);
    
    // Test the invitesByEmail endpoint
    console.log('\n📧 Testing invitesByEmail endpoint...\n');
    
    const response = await fetch('http://localhost:3334/trpc/team.invitesByEmail', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Endpoint working!');
        console.log('Invites:', data);
      } catch (e) {
        console.log('\n⚠️ Response is not JSON:', responseText);
      }
    } else {
      console.error('\n❌ Endpoint failed');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

testInvitesEndpoint();