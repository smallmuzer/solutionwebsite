import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "app.db"));

console.log("\n=== DATABASE VERIFICATION ===\n");

// Check all tables
console.log("📋 All Tables:");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(`  - ${t.name}`));

// Check if user_roles exists
const userRolesExists = tables.some(t => t.name === 'user_roles');
console.log(`\n❌ user_roles table exists: ${userRolesExists ? 'YES (should be removed!)' : 'NO (correct!)'}`);

// Check users table structure
console.log("\n👤 Users Table Structure:");
const usersSchema = db.prepare("PRAGMA table_info(users)").all();
usersSchema.forEach(col => console.log(`  - ${col.name} (${col.type})`));

// Check users data
console.log("\n👥 Users Data:");
const users = db.prepare("SELECT id, email, userrole FROM users").all();
users.forEach(u => console.log(`  - ${u.email} (${u.userrole})`));

// Check data counts
console.log("\n📊 Data Counts:");
const counts = [
  'client_logos',
  'contact_submissions',
  'chat_threads',
  'chat_messages',
  'job_applications',
  'application_replies',
  'submission_replies'
];

counts.forEach(table => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
    console.log(`  - ${table}: ${count.c} rows`);
  } catch (e) {
    console.log(`  - ${table}: ERROR - ${e.message}`);
  }
});

console.log("\n=== VERIFICATION COMPLETE ===\n");

db.close();
