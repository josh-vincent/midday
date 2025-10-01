import { primaryDb } from '../src/client';
import { userInvites } from '../src/schema';

async function testUserInvites() {
  const db = primaryDb;
  
  try {
    console.log('Testing user_invites table...');
    
    // Try to count records
    const result = await db.select().from(userInvites).limit(1);
    
    console.log('✅ user_invites table exists and is accessible');
    console.log(`Found ${result.length} records`);
    
  } catch (error: any) {
    console.error('❌ Error accessing user_invites table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testUserInvites();