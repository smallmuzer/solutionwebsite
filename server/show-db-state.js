import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "app.db");

const db = new Database(dbPath);

console.log("\n=== CURRENT DATABASE STATE ===\n");

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("📋 All Tables in app.db:");
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`  - ${t.name} (${count.c} rows)`);
});

// Check for user_roles
const userRolesExists = tables.some(t => t.name === 'user_roles');
console.log(`\n${userRolesExists ? '❌ ERROR' : '✅ SUCCESS'}: user_roles table ${userRolesExists ? 'STILL EXISTS' : 'has been REMOVED'}`);

// Show users table structure
console.log("\n👤 Users Table Structure:");
const usersSchema = db.prepare("PRAGMA table_info(users)").all();
usersSchema.forEach(col => {
  const marker = col.name === 'userrole' ? ' ✅' : '';
  console.log(`  - ${col.name} (${col.type})${marker}`);
});

// Show all users
console.log("\n👥 All Users in Database:");
const users = db.prepare("SELECT id, email, userrole, created_at FROM users").all();
if (users.length === 0) {
  console.log("  ⚠️  No users found!");
} else {
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.userrole}) - ID: ${u.id}`);
  });
}

// Show data counts
console.log("\n📊 Data Counts in Requested Tables:");
const requestedTables = [
  'client_logos',
  'contact_submissions',
  'chat_threads',
  'chat_messages',
  'job_applications',
  'application_replies',
  'submission_replies'
];

requestedTables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  console.log(`  - ${table}: ${count.c} rows`);
});

console.log("\n=== SUMMARY ===");
console.log(`✅ user_roles table: ${userRolesExists ? 'NOT removed (needs fix)' : 'REMOVED'}`);
console.log(`✅ users table with userrole: ${usersSchema.some(c => c.name === 'userrole') ? 'EXISTS' : 'MISSING'}`);
console.log(`✅ Admin user: ${users.length > 0 ? 'EXISTS' : 'MISSING'}`);
console.log(`✅ Live data: ${requestedTables.every(t => db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c > 0) ? 'POPULATED' : 'SOME TABLES EMPTY'}`);

console.log("\n📁 Database file: " + dbPath);
console.log("\n=== COMPLETE ===\n");

db.close();
