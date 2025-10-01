import { primaryDb } from '../src/client';
import { users, teams, usersOnTeam } from '../src/schema';
import { eq } from 'drizzle-orm';

async function testUserTeams() {
  const db = primaryDb;
  
  try {
    console.log('\n🔍 Testing user teams data...\n');
    
    // 1. Check users table
    console.log('1. Checking users...');
    const allUsers = await db.select().from(users).limit(5);
    console.log(`Found ${allUsers.length} users`);
    
    if (allUsers.length > 0) {
      console.log('\nUser details:');
      allUsers.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Email: ${user.email || 'NO EMAIL'}`);
        console.log(`  Name: ${user.fullName || 'NO NAME'}`);
        console.log(`  Team ID: ${user.teamId || 'NO TEAM'}`);
        console.log('');
      });
    }
    
    // 2. Check teams table
    console.log('\n2. Checking teams...');
    const allTeams = await db.select().from(teams).limit(5);
    console.log(`Found ${allTeams.length} teams`);
    
    if (allTeams.length > 0) {
      console.log('\nTeam details:');
      allTeams.forEach(team => {
        console.log(`- ID: ${team.id}`);
        console.log(`  Name: ${team.name}`);
        console.log('');
      });
    }
    
    // 3. Check users_on_team table
    console.log('\n3. Checking users_on_team relationships...');
    const relationships = await db.select().from(usersOnTeam).limit(10);
    console.log(`Found ${relationships.length} user-team relationships`);
    
    if (relationships.length > 0) {
      console.log('\nRelationship details:');
      relationships.forEach(rel => {
        console.log(`- User: ${rel.userId}`);
        console.log(`  Team: ${rel.teamId}`);
        console.log(`  Role: ${rel.role}`);
        console.log('');
      });
    }
    
    // 4. Check specific user (admin@tocld.com)
    console.log('\n4. Checking admin@tocld.com user...');
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@tocld.com'))
      .limit(1);
    
    if (adminUser.length > 0) {
      const admin = adminUser[0];
      console.log('Admin user found:');
      console.log(`- ID: ${admin.id}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Name: ${admin.fullName}`);
      console.log(`- Team ID: ${admin.teamId || 'NO TEAM'}`);
      
      // Check if admin is in users_on_team
      if (admin.id) {
        const adminTeams = await db
          .select({
            teamId: usersOnTeam.teamId,
            role: usersOnTeam.role,
            teamName: teams.name,
          })
          .from(usersOnTeam)
          .leftJoin(teams, eq(usersOnTeam.teamId, teams.id))
          .where(eq(usersOnTeam.userId, admin.id));
        
        console.log(`\nAdmin is in ${adminTeams.length} teams:`);
        adminTeams.forEach(t => {
          console.log(`- Team: ${t.teamName} (${t.teamId}), Role: ${t.role}`);
        });
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testUserTeams();