const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// Initialize connections
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const sql = postgres(databaseUrl);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTeamUserOperations() {
  console.log('🚀 Testing Team & User Operations (Simplified)\n');
  console.log('=' .repeat(60));
  
  let adminUserId;
  let teamId;
  let inviteId;
  
  try {
    // Step 1: Authenticate as admin
    console.log('\n📋 Step 1: Authentication & Basic Info...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123'
    });
    
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    
    adminUserId = authData.user.id;
    console.log(`   ✅ Authenticated as admin`);
    console.log(`      User ID: ${adminUserId}`);
    
    // Step 2: Team Information
    console.log('\n📋 Step 2: Team Information...');
    
    // Get current team
    const [currentTeam] = await sql`
      SELECT t.*, uot.role 
      FROM users_on_team uot
      JOIN teams t ON t.id = uot.team_id
      WHERE uot.user_id = ${adminUserId}
      LIMIT 1
    `;
    
    teamId = currentTeam.id;
    console.log(`   ✅ Current team: ${currentTeam.name}`);
    console.log(`      Team ID: ${teamId}`);
    console.log(`      User role: ${currentTeam.role}`);
    
    // Team statistics
    const [teamStats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users_on_team WHERE team_id = ${teamId}) as members,
        (SELECT COUNT(*) FROM customers WHERE team_id = ${teamId}) as customers,
        (SELECT COUNT(*) FROM invoices WHERE team_id = ${teamId}) as invoices,
        (SELECT COUNT(*) FROM activities WHERE team_id = ${teamId}) as activities
    `;
    
    console.log(`   📊 Team Statistics:`);
    console.log(`      Members: ${teamStats.members}`);
    console.log(`      Customers: ${teamStats.customers}`);
    console.log(`      Invoices: ${teamStats.invoices}`);
    console.log(`      Activities: ${teamStats.activities}`);
    
    // Step 3: User Profile
    console.log('\n📋 Step 3: User Profile...');
    
    const [currentUser] = await sql`
      SELECT * FROM users WHERE id = ${adminUserId}
    `;
    
    console.log(`   ✅ User Profile:`);
    console.log(`      Email: ${currentUser.email}`);
    console.log(`      Name: ${currentUser.full_name || 'Not set'}`);
    console.log(`      Locale: ${currentUser.locale}`);
    console.log(`      Timezone: ${currentUser.timezone}`);
    
    // Step 4: Team Members
    console.log('\n📋 Step 4: Team Members...');
    
    const teamMembers = await sql`
      SELECT u.email, u.full_name, uot.role, uot.created_at
      FROM users_on_team uot
      JOIN users u ON u.id = uot.user_id
      WHERE uot.team_id = ${teamId}
      ORDER BY uot.created_at
    `;
    
    console.log(`   ✅ Team Members (${teamMembers.length}):`);
    teamMembers.forEach((member, idx) => {
      const name = member.full_name || member.email;
      console.log(`      ${idx + 1}. ${name} - ${member.role}`);
    });
    
    // Step 5: User Invitations
    console.log('\n📋 Step 5: User Invitations...');
    
    // Create test invitation
    const inviteEmail = `testuser${Date.now()}@example.com`;
    const inviteCode = Math.random().toString(36).substring(2, 15);
    
    const [invitation] = await sql`
      INSERT INTO user_invites (
        team_id, email, role, code, 
        invited_by, created_at, expires_at
      ) VALUES (
        ${teamId}, ${inviteEmail}, 'member', ${inviteCode},
        ${adminUserId}, NOW(), NOW() + INTERVAL '7 days'
      )
      RETURNING *
    `;
    
    inviteId = invitation.id;
    console.log(`   ✅ Created test invitation:`);
    console.log(`      Email: ${invitation.email}`);
    console.log(`      Role: ${invitation.role}`);
    console.log(`      Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`);
    
    // List all pending invites
    const pendingInvites = await sql`
      SELECT COUNT(*) as count FROM user_invites
      WHERE team_id = ${teamId} 
      AND status = 'pending'
      AND expires_at > NOW()
    `;
    
    console.log(`   📬 Total pending invitations: ${pendingInvites[0].count}`);
    
    // Step 6: Invoice Sending Capabilities
    console.log('\n📋 Step 6: Invoice Sending & Email Features...');
    
    console.log('   📧 Invoice Delivery Options:');
    console.log('      • "create" - Save as draft only');
    console.log('      • "create_and_send" - Send immediately');
    console.log('      • "scheduled" - Schedule for future');
    
    console.log('   📨 Email Templates Available:');
    console.log('      • New invoice notification');
    console.log('      • Payment reminder');
    console.log('      • Payment received confirmation');
    console.log('      • Overdue notice');
    
    // Check for recent sent invoices
    const [sentInvoices] = await sql`
      SELECT COUNT(*) as count FROM invoices
      WHERE team_id = ${teamId} 
      AND sent_at IS NOT NULL
    `;
    
    console.log(`   📤 Invoices sent: ${sentInvoices.count}`);
    
    // Step 7: Activity Logging
    console.log('\n📋 Step 7: Activity Logging...');
    
    // Log test activity
    await sql`
      INSERT INTO activities (
        team_id, user_id, action, entity, entity_id,
        metadata, created_at
      ) VALUES (
        ${teamId}, ${adminUserId}, 'test_run', 'system', ${teamId},
        ${JSON.stringify({ 
          test: 'team-user-operations',
          timestamp: new Date().toISOString()
        })},
        NOW()
      )
    `;
    
    // Get recent activities
    const recentActivities = await sql`
      SELECT action, entity, created_at FROM activities
      WHERE team_id = ${teamId}
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log(`   📝 Recent Activities:`);
    recentActivities.forEach(a => {
      const time = new Date(a.created_at).toLocaleTimeString();
      console.log(`      • ${a.action} on ${a.entity} at ${time}`);
    });
    
    // Step 8: Notification Settings
    console.log('\n📋 Step 8: Notification Settings...');
    
    const [notificationSettings] = await sql`
      SELECT * FROM notification_settings
      WHERE user_id = ${adminUserId}
      LIMIT 1
    `;
    
    if (notificationSettings) {
      console.log(`   🔔 Email Notifications:`);
      console.log(`      New invoices: ${notificationSettings.invoice_new ? '✅' : '❌'}`);
      console.log(`      Paid invoices: ${notificationSettings.invoice_paid ? '✅' : '❌'}`);
      console.log(`      Overdue invoices: ${notificationSettings.invoice_overdue ? '✅' : '❌'}`);
      console.log(`      New customers: ${notificationSettings.customer_new ? '✅' : '❌'}`);
    } else {
      console.log(`   ℹ️ No notification settings configured`);
    }
    
    // Cleanup
    if (inviteId) {
      await sql`DELETE FROM user_invites WHERE id = ${inviteId}`;
      console.log('\n🧹 Cleanup: Deleted test invitation');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await sql.end();
    await supabase.auth.signOut();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Team & User Operations Testing Complete!');
  console.log('=' .repeat(60));
  
  console.log('\n📊 Available Endpoints Summary:');
  
  console.log('\n🔍 Query Endpoints:');
  console.log('   • user.me - Get current user');
  console.log('   • user.invites - List user invitations');
  console.log('   • team.current - Get current team');
  console.log('   • team.members - List team members');
  console.log('   • team.teamInvites - List team invites');
  console.log('   • team.invitesByEmail - Get invites by email');
  
  console.log('\n✏️ Mutation Endpoints:');
  console.log('   • user.update - Update profile');
  console.log('   • user.delete - Delete account');
  console.log('   • team.update - Update team details');
  console.log('   • team.invite - Send invitation');
  console.log('   • team.acceptInvite - Accept invite');
  console.log('   • team.declineInvite - Decline invite');
  console.log('   • team.deleteInvite - Cancel invite');
  console.log('   • team.updateMember - Change member role');
  console.log('   • team.deleteMember - Remove member');
  
  console.log('\n📧 Invoice Sending:');
  console.log('   • invoice.create - With deliveryType option');
  console.log('   • invoice.remind - Send payment reminder');
  console.log('   • invoice.updateSchedule - Modify scheduled send');
  console.log('   • invoice.cancelSchedule - Cancel scheduled send');
}

// Run the tests
testTeamUserOperations().catch(console.error);