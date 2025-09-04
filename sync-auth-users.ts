import { createClient } from "@midday/supabase/server";
import { primaryDb } from "@midday/db/client";
import { users } from "@midday/db/schema";
import { eq } from "drizzle-orm";

async function syncAuthUsersToPublic() {
  const supabase = createClient();
  const db = primaryDb;
  
  console.log("Starting sync of auth.users to public.users...\n");
  
  // Get all users from auth.users
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("Error fetching auth users:", error);
    return;
  }
  
  console.log(`Found ${authUsers.users.length} users in auth.users table\n`);
  
  for (const authUser of authUsers.users) {
    console.log(`Processing user: ${authUser.email} (${authUser.id})`);
    
    // Check if user exists in public.users
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);
    
    if (existingUser.length > 0) {
      console.log(`  ✓ User already exists in public.users`);
    } else {
      console.log(`  ⚠ User missing from public.users - creating...`);
      
      try {
        // Insert user into public.users table
        await db.insert(users).values({
          id: authUser.id,
          email: authUser.email!,
          fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatarUrl: authUser.user_metadata?.avatar_url || null,
          locale: authUser.user_metadata?.locale || "en",
          weekStarts: 1, // Default to Monday
          teamId: null, // No team assigned yet
          timeFormat: 24,
          timezone: authUser.user_metadata?.timezone || "UTC",
          dateFormat: "yyyy-MM-dd",
          createdAt: authUser.created_at,
          updatedAt: authUser.updated_at || authUser.created_at,
        });
        
        console.log(`  ✅ User created in public.users`);
      } catch (err) {
        console.error(`  ❌ Error creating user:`, err);
      }
    }
  }
  
  console.log("\n=== Sync Summary ===");
  
  // Get final count
  const publicUsers = await db.select().from(users);
  console.log(`Total users in auth.users: ${authUsers.users.length}`);
  console.log(`Total users in public.users: ${publicUsers.length}`);
  
  // List any users still missing
  const publicUserIds = new Set(publicUsers.map(u => u.id));
  const missingUsers = authUsers.users.filter(au => !publicUserIds.has(au.id));
  
  if (missingUsers.length > 0) {
    console.log(`\n⚠ Still missing ${missingUsers.length} users:`);
    missingUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.id})`);
    });
  } else {
    console.log("\n✅ All auth users are now in public.users!");
  }
}

syncAuthUsersToPublic()
  .then(() => {
    console.log("\nSync completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error during sync:", err);
    process.exit(1);
  });