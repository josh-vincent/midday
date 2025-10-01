import { connectDb } from "../src/client";
import { users } from "../src/schema";

async function createUser() {
  const db = await connectDb();
  
  try {
    const result = await db.insert(users).values({
      id: "99a44313-c400-42dc-a556-60be2d6354e1",
      email: "admin@tocld.com",
      fullName: "Admin User",
      teamId: null,
    }).onConflictDoNothing();
    
    console.log("User created successfully:", result);
  } catch (error) {
    console.error("Error creating user:", error);
  }
  
  process.exit(0);
}

createUser();