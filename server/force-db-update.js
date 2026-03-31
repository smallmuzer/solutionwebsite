import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "app.db"));

console.log("\n=== FORCING DATABASE UPDATE ===\n");

// Check if user_roles exists
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_roles'").all();
console.log(`user_roles table exists: ${tables.length > 0 ? 'YES' : 'NO'}`);

if (tables.length > 0) {
  console.log("Dropping user_roles table...");
  db.exec("DROP TABLE user_roles;");
  console.log("✅ user_roles table dropped");
} else {
  console.log("✅ user_roles table already removed");
}

// Check if users table has userrole field
const usersSchema = db.prepare("PRAGMA table_info(users)").all();
const hasUserRole = usersSchema.some(col => col.name === 'userrole');

console.log(`\nusers table has userrole field: ${hasUserRole ? 'YES' : 'NO'}`);

if (!hasUserRole) {
  console.log("Adding userrole field to users table...");
  db.exec("ALTER TABLE users ADD COLUMN userrole TEXT NOT NULL DEFAULT 'admin';");
  console.log("✅ userrole field added");
} else {
  console.log("✅ userrole field already exists");
}

// Ensure admin user exists
const adminUser = db.prepare("SELECT * FROM users WHERE email = 'admin@solutions.com.mv'").get();
if (!adminUser) {
  console.log("\nInserting admin user...");
  const t0 = new Date().toISOString();
  db.prepare("INSERT INTO users (id, email, password, userrole, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run("admin-local", "admin@solutions.com.mv", "Admin@1234", "admin", t0, t0);
  console.log("✅ Admin user inserted");
} else {
  console.log("\n✅ Admin user already exists");
  // Update userrole if it doesn't have it
  if (!adminUser.userrole) {
    db.prepare("UPDATE users SET userrole = 'admin' WHERE email = 'admin@solutions.com.mv'").run();
    console.log("✅ Admin user updated with userrole");
  }
}

// Force checkpoint to write WAL to main database file
console.log("\nCheckpointing database (writing WAL to main file)...");
db.pragma("wal_checkpoint(TRUNCATE)");
console.log("✅ Database checkpointed");

// Verify final state
console.log("\n=== FINAL VERIFICATION ===");
const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("\n📋 All Tables:");
finalTables.forEach(t => console.log(`  - ${t.name}`));

const finalUsers = db.prepare("SELECT id, email, userrole FROM users").all();
console.log("\n👥 Users:");
finalUsers.forEach(u => console.log(`  - ${u.email} (${u.userrole})`));

console.log("\n=== UPDATE COMPLETE ===\n");

db.close();
