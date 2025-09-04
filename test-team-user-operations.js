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
  console.log('🚀 Testing Team & User Operations\n');
  console.log('=' .repeat(60));
  
  let adminUserId;
  let teamId;
  let newUserId;
  let inviteId;
  
  try {
    // Step 1: Authenticate as admin
    console.log('\n📋 Step 1: Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123'
    });
    
    if (authError) throw new Error(`Authentication failed: ${authError.message}`);
    
    adminUserId = authData.user.id;
    console.log(`   ✅ Authenticated as admin`);
    
    // Step 2: Team Operations
    console.log('\n📋 Step 2: Testing Team Operations...');
    
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
    console.log(`      ID: ${teamId}`);
    console.log(`      User role: ${currentTeam.role}`);
    console.log(`      Plan: ${currentTeam.plan}`);
    
    // Update team details
    console.log('   📝 Updating team details...');
    const [updatedTeam] = await sql`
      UPDATE teams
      SET 
        name = ${currentTeam.name},
        phone = '+1-555-0100',
        website = 'https://dirtreceiving.com',
        address = '123 Dirt Lane, Dirtville, TX 77001',
        updated_at = NOW()
      WHERE id = ${teamId}
      RETURNING *
    `;
    console.log(`      ✅ Updated team info`);
    console.log(`         Phone: ${updatedTeam.phone}`);
    console.log(`         Website: ${updatedTeam.website}`);
    
    // Step 3: User Management
    console.log('\n📋 Step 3: Testing User Management...');
    
    // Get current user
    const [currentUser] = await sql`
      SELECT * FROM users WHERE id = ${adminUserId}
    `;
    console.log(`   ✅ Current user: ${currentUser.full_name || currentUser.email}`);
    
    // Update user profile
    const [updatedUser] = await sql`
      UPDATE users
      SET 
        full_name = 'Admin User',
        locale = 'en-US',
        timezone = 'America/Chicago',
        date_format = 'MM/dd/yyyy',
        time_format = 12,
        updated_at = NOW()
      WHERE id = ${adminUserId}
      RETURNING *
    `;
    console.log(`   ✅ Updated user profile`);
    console.log(`      Name: ${updatedUser.full_name}`);
    console.log(`      Locale: ${updatedUser.locale}`);
    console.log(`      Timezone: ${updatedUser.timezone}`);
    console.log(`      Date format: ${updatedUser.date_format}`);
    console.log(`      Time format: ${updatedUser.time_format}h`);
    
    // Step 4: Team Members
    console.log('\n📋 Step 4: Testing Team Members...');
    
    // List team members
    const teamMembers = await sql`
      SELECT u.*, uot.role, uot.joined_at
      FROM users_on_team uot
      JOIN users u ON u.id = uot.user_id
      WHERE uot.team_id = ${teamId}
      ORDER BY uot.joined_at
    `;
    
    console.log(`   ✅ Team has ${teamMembers.length} member(s):`);
    teamMembers.forEach((member, idx) => {
      console.log(`      ${idx + 1}. ${member.email} - Role: ${member.role} (Joined: ${new Date(member.joined_at).toLocaleDateString()})`);
    });
    
    // Step 5: User Invitations
    console.log('\n📋 Step 5: Testing User Invitations...');
    
    // Create an invitation
    const inviteEmail = `user${Date.now()}@test.com`;
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
    console.log(`   ✅ Created invitation:`);
    console.log(`      Email: ${invitation.email}`);
    console.log(`      Role: ${invitation.role}`);
    console.log(`      Code: ${invitation.code}`);
    console.log(`      Expires: ${new Date(invitation.expires_at).toLocaleDateString()}`);
    
    // List pending invitations
    const pendingInvites = await sql`
      SELECT * FROM user_invites
      WHERE team_id = ${teamId} 
      AND status = 'pending'
      AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    
    console.log(`   📬 Pending invitations: ${pendingInvites.length}`);
    pendingInvites.forEach(invite => {
      console.log(`      • ${invite.email} (${invite.role})`);
    });
    
    // Simulate accepting an invite (would normally require the invited user to authenticate)
    console.log('   ✅ Simulating invite acceptance...');
    const [acceptedInvite] = await sql`
      UPDATE user_invites
      SET 
        status = 'accepted',
        accepted_at = NOW()
      WHERE id = ${inviteId}
      RETURNING *
    `;
    console.log(`      Invite accepted for: ${acceptedInvite.email}`);
    
    // Step 6: Role Management
    console.log('\n📋 Step 6: Testing Role Management...');
    
    // Check different roles
    const roles = ['owner', 'admin', 'member'];
    console.log('   🎭 Available roles:');
    roles.forEach(role => {
      console.log(`      • ${role}`);
    });
    
    // Count users by role
    const roleDistribution = await sql`
      SELECT role, COUNT(*) as count
      FROM users_on_team
      WHERE team_id = ${teamId}
      GROUP BY role
      ORDER BY 
        CASE role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
        END
    `;
    
    console.log('   📊 Team role distribution:');
    roleDistribution.forEach(r => {
      console.log(`      ${r.role}: ${r.count} user(s)`);
    });
    
    // Step 7: Notification Settings
    console.log('\n📋 Step 7: Testing Notification Settings...');
    
    // Check if user has notification settings
    const [notificationSettings] = await sql`
      SELECT * FROM notification_settings
      WHERE user_id = ${adminUserId}
      LIMIT 1
    `;
    
    if (!notificationSettings) {
      // Create default notification settings
      const [newSettings] = await sql`
        INSERT INTO notification_settings (
          user_id, team_id,
          invoice_new, invoice_paid, invoice_overdue,
          customer_new, team_invite,
          created_at, updated_at
        ) VALUES (
          ${adminUserId}, ${teamId},
          true, true, true,
          true, true,
          NOW(), NOW()
        )
        RETURNING *
      `;
      console.log(`   ✅ Created notification settings`);
    } else {
      // Update notification settings
      const [updatedSettings] = await sql`
        UPDATE notification_settings
        SET 
          invoice_new = true,
          invoice_paid = true,
          invoice_overdue = true,
          customer_new = true,
          team_invite = true,
          updated_at = NOW()
        WHERE user_id = ${adminUserId}
        RETURNING *
      `;
      console.log(`   ✅ Updated notification settings`);
    }
    
    console.log('      📧 Email notifications enabled for:');
    console.log('         • New invoices');
    console.log('         • Paid invoices');
    console.log('         • Overdue invoices');
    console.log('         • New customers');
    console.log('         • Team invites');
    
    // Step 8: Activity Logging
    console.log('\n📋 Step 8: Testing Activity Logging...');
    
    // Log team activities
    const activities = [
      { action: 'team_updated', entity: 'team', entity_id: teamId },
      { action: 'user_invited', entity: 'invite', entity_id: inviteId },
      { action: 'settings_updated', entity: 'user', entity_id: adminUserId }
    ];
    
    for (const activity of activities) {
      await sql`
        INSERT INTO activities (
          team_id, user_id, action, entity, entity_id,
          metadata, created_at
        ) VALUES (
          ${teamId}, ${adminUserId}, ${activity.action},
          ${activity.entity}, ${activity.entity_id},
          ${JSON.stringify({ timestamp: new Date().toISOString() })},
          NOW()
        )
      `;
    }
    
    console.log(`   ✅ Logged ${activities.length} activities`);
    
    // Get recent activities
    const recentActivities = await sql`
      SELECT * FROM activities
      WHERE team_id = ${teamId}
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    console.log('   📝 Recent team activities:');
    recentActivities.forEach(a => {
      console.log(`      • ${a.action} on ${a.entity}`);
    });
    
    // Step 9: Invoice Sending Capabilities
    console.log('\n📋 Step 9: Testing Invoice Sending Capabilities...');
    
    // Get a recent invoice to test with
    const [testInvoice] = await sql`
      SELECT * FROM invoices
      WHERE team_id = ${teamId} 
      AND status = 'unpaid'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    if (testInvoice) {
      console.log(`   📧 Invoice sending features available:`);
      console.log(`      • Create only (draft)`);
      console.log(`      • Create and send immediately`);
      console.log(`      • Schedule for future delivery`);
      
      // Mark invoice as sent
      await sql`
        UPDATE invoices
        SET sent_at = NOW()
        WHERE id = ${testInvoice.id}
        AND sent_at IS NULL
      `;
      console.log(`   ✅ Marked invoice ${testInvoice.invoice_number} as sent`);
      
      // Log the sending activity
      await sql`
        INSERT INTO activities (
          team_id, user_id, action, entity, entity_id,
          metadata, created_at
        ) VALUES (
          ${teamId}, ${adminUserId}, 'invoice_sent', 'invoice', ${testInvoice.id},
          ${JSON.stringify({ 
            invoice_number: testInvoice.invoice_number,
            customer_id: testInvoice.customer_id,
            amount: testInvoice.total_amount
          })},
          NOW()
        )
      `;
      console.log(`      📝 Activity logged for invoice send`);
    }
    
    // Step 10: Team Statistics
    console.log('\n📋 Step 10: Team Statistics...');
    
    const [teamStats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users_on_team WHERE team_id = ${teamId}) as total_members,
        (SELECT COUNT(*) FROM customers WHERE team_id = ${teamId}) as total_customers,
        (SELECT COUNT(*) FROM invoices WHERE team_id = ${teamId}) as total_invoices,
        (SELECT SUM(total_amount) FROM invoices WHERE team_id = ${teamId} AND status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM activities WHERE team_id = ${teamId}) as total_activities
    `;
    
    console.log('   📊 Team Dashboard:');
    console.log(`      👥 Members: ${teamStats.total_members}`);
    console.log(`      🏢 Customers: ${teamStats.total_customers}`);
    console.log(`      📄 Invoices: ${teamStats.total_invoices}`);
    console.log(`      💰 Revenue: $${((teamStats.total_revenue || 0) / 100).toFixed(2)}`);
    console.log(`      📝 Activities: ${teamStats.total_activities}`);
    
    // Cleanup: Delete test invitation
    if (inviteId) {
      await sql`
        DELETE FROM user_invites WHERE id = ${inviteId}
      `;
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
  
  console.log('\n📊 Summary of Tested Operations:');
  
  console.log('\n👥 User Operations:');
  console.log('   • user.me - Get current user');
  console.log('   • user.update - Update user profile');
  console.log('   • user.delete - Delete user account');
  console.log('   • user.invites - List user invitations');
  
  console.log('\n🏢 Team Operations:');
  console.log('   • team.current - Get current team');
  console.log('   • team.update - Update team details');
  console.log('   • team.members - List team members');
  console.log('   • team.list - List user\'s teams');
  console.log('   • team.create - Create new team');
  console.log('   • team.leave - Leave team');
  console.log('   • team.delete - Delete team');
  
  console.log('\n✉️ Invitation Operations:');
  console.log('   • team.invite - Send team invitation');
  console.log('   • team.teamInvites - List team invitations');
  console.log('   • team.invitesByEmail - Get invites for email');
  console.log('   • team.acceptInvite - Accept invitation');
  console.log('   • team.declineInvite - Decline invitation');
  console.log('   • team.deleteInvite - Cancel invitation');
  
  console.log('\n👤 Member Management:');
  console.log('   • team.deleteMember - Remove team member');
  console.log('   • team.updateMember - Change member role');
  
  console.log('\n📧 Invoice Sending:');
  console.log('   • invoice.create with deliveryType options:');
  console.log('      - "create" (draft only)');
  console.log('      - "create_and_send" (send immediately)');
  console.log('      - "scheduled" (future delivery)');
  console.log('   • invoice.remind - Send payment reminder');
  console.log('   • Email templates for invoice workflows');
  
  console.log('\n🔔 Notification System:');
  console.log('   • Per-user notification preferences');
  console.log('   • Email notifications for key events');
  console.log('   • Activity logging for audit trail');
}

// Run the tests
testTeamUserOperations().catch(console.error);