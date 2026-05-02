const crypto = require("crypto");
const prisma = require("../lib/prisma");

/**
 * Script to create a Super Admin user for testing
 * 
 * This script:
 * 1. Creates a user in Supabase Auth (or you can use existing user)
 * 2. Creates/updates Userext profile with SuperAdmin role
 * 
 * Usage:
 *   node scripts/create-superadmin.js
 * 
 * Or with existing user ID:
 *   node scripts/create-superadmin.js --user-id YOUR_USER_ID
 */

async function getUserInput(prompt) {
  return new Promise((resolve) => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });
}

async function createSuperAdmin(email, password, fullName) {
  console.log("\n🔐 Creating Super Admin User...\n");

  // Note: In production, you should create users via Supabase Auth API
  // For local dev, we'll just create the Userext record
  // You'll need to create the auth user separately via Supabase dashboard or API
  
  const userId = crypto.randomUUID();
  
  console.log(`📝 User ID: ${userId}`);
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Full Name: ${fullName}`);
  console.log(`🔑 Role: SuperAdmin\n`);

  // Create or update Userext with SuperAdmin role
  const userext = await prisma.userext.upsert({
    where: { id: userId },
    update: {
      full_name: fullName,
      role: "SuperAdmin",
    },
    create: {
      id: userId,
      full_name: fullName,
      phone: null,
      role: "SuperAdmin",
    },
  });

  console.log("✅ Super Admin user created successfully!\n");
  console.log("⚠️  IMPORTANT: You need to create a matching user in Supabase Auth:");
  console.log(`   - User ID: ${userId}`);
  console.log(`   - Email: ${email}`);
  console.log(`   - Password: ${password}\n`);
  console.log("📋 Next steps:");
  console.log("   1. Go to your Supabase Dashboard");
  console.log("   2. Navigate to Authentication > Users");
  console.log("   3. Click 'Add user' > 'Create new user'");
  console.log("   4. Enter the email and password shown above");
  console.log("   5. Copy the User ID from Supabase");
  console.log("   6. Update the Userext record with the correct ID:\n");
  console.log(`   UPDATE "public"."Userext"`);
  console.log(`   SET id = '${userId}'`);
  console.log(`   WHERE full_name = '${fullName}';\n`);

  return userext;
}

async function updateExistingUser(userId, fullName) {
  console.log("\n🔐 Updating Existing User to Super Admin...\n");

  const userext = await prisma.userext.update({
    where: { id: userId },
    data: {
      full_name: fullName,
      role: "SuperAdmin",
    },
  });

  console.log("✅ User updated to Super Admin successfully!\n");
  console.log(`📝 User ID: ${userId}`);
  console.log(`👤 Full Name: ${fullName}`);
  console.log(`🔑 Role: SuperAdmin\n`);

  return userext;
}

async function main() {
  const args = process.argv.slice(2);
  const userIdIndex = args.indexOf("--user-id");
  const userId = userIdIndex !== -1 ? args[userIdIndex + 1] : null;

  if (userId) {
    // Update existing user
    const fullName = await getUserInput("Enter full name: ");
    await updateExistingUser(userId, fullName || "Super Admin");
  } else {
    // Create new user
    const email = await getUserInput("Enter email: ");
    const password = await getUserInput("Enter password: ");
    const fullName = await getUserInput("Enter full name: ");

    if (!email || !password || !fullName) {
      console.log("❌ All fields are required!");
      process.exit(1);
    }

    await createSuperAdmin(email, password, fullName);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
