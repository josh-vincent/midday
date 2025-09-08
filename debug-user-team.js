#!/usr/bin/env node

// Debug the user-team association issue

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ulncfblvuijlgniydjju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmNmYmx2dWlqbGduaXlkamp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NTkxODUsImV4cCI6MjA3MjUzNTE4NX0.pCycxnDK259p3AqhTuet9k20ErxOYEJReDUI5iBG6Ik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUserTeam() {
  console.log('🔍 Debugging User-Team Association\n');
  
  try {
    await supabase.auth.signInWithPassword({
      email: 'admin@tocld.com',
      password: 'Admin123',
    });

    const { data: { user } } = await supabase.auth.getUser();
    console.log('Authenticated user:', user?.id);
    
    // Check user data (what the middleware checks)
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('\nUser data (from users table):', JSON.stringify(userData, null, 2));
    
    // Check users_on_team table
    const { data: userTeamData } = await supabase
      .from('users_on_team')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('\nUser team associations (from users_on_team table):', JSON.stringify(userTeamData, null, 2));
    
    // Check all teams
    const { data: allTeams } = await supabase
      .from('teams')
      .select('*');
      
    console.log('\nAll teams:', JSON.stringify(allTeams, null, 2));
    
    // If user has no team_id, let's fix it
    if (!userData?.team_id && allTeams?.length > 0) {
      console.log('\n⚠️  User has no team_id, attempting to fix...');
      
      const teamId = allTeams[0].id;
      console.log('Using team:', teamId);
      
      // Update user table
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: teamId })
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating user team_id:', updateError);
      } else {
        console.log('✅ Updated user team_id');
      }
      
      // Check if there's a users_on_team record
      if (!userTeamData?.length) {
        const { error: insertError } = await supabase
          .from('users_on_team')
          .insert({
            user_id: user.id,
            team_id: teamId,
            role: 'owner'
          });
          
        if (insertError) {
          console.error('Error creating users_on_team record:', insertError);
        } else {
          console.log('✅ Created users_on_team record');
        }
      }
    }
    
    console.log('\n✅ Debug complete');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugUserTeam();