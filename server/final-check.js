import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "app.db");

// Close any existing connections and clean up WAL files
console.log("\n=== CLEANING UP WAL FILES ===\n");

const walPath = dbPath + "-wal";
const shmPath = dbPath + "-shm";

// Open and close database to ensure WAL is checkpointed
let db = new Database(dbPath);
db.pragma("wal_checkpoint(TRUNCATE)");
db.close();

// Delete WAL and SHM files
if (existsSync(walPath)) {
  unlinkSync(walPath);
  console.log("✅ Deleted app.db-wal");
}
if (existsSync(shmPath)) {
  unlinkSync(shmPath);
  console.log("✅ Deleted app.db-shm");
}

// Reopen database
db = new Database(dbPath);

console.log("\n=== FINAL DATABASE STATE ===\n");

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("📋 All Tables in app.db:");
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`  - ${t.name} (${count.c} rows)`);
});

// Check for user_roles
const userRolesExists = tables.some(t => t.name === 'user_roles');
console.log(`\n${userRolesExists ? '❌' : '✅'} user_roles table: ${userRolesExists ? 'EXISTS (ERROR!)' : 'REMOVED (correct!)'}`);

// Show users table structure
console.log("\n👤 Users Table Structure:");
const usersSchema = db.prepare("PRAGMA table_info(users)").all();
usersSchema.forEach(col => {
  console.log(`  - ${col.name} (${col.type})${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
});

// Show all users
console.log("\n👥 All Users in Database:");
const users = db.prepare("SELECT * FROM users").all();
users.forEach(u => {
  console.log(`  - ID: ${u.id}`);
  console.log(`    Email: ${u.email}`);
  console.log(`    Password: ${u.password}`);
  console.log(`    Role: ${u.userrole}`);
  console.log(`    Created: ${u.created_at}`);
  console.log("");
});

// Show data in all requested tables
console.log("📊 Data in Requested Tables:");
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

console.log("\n=== DATABASE FILE INFO ===");
console.log(`📁 Database file: ${dbPath}`);
console.log(`📏 File size: ${Math.round(db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get().size / 1024)} KB`);

console.log("\n✅ All changes have been written to app.db");
console.log("✅ WAL and SHM files have been removed");
console.log("\n🔍 You can now upload app.db to https://sqliteviewer.app/");
console.log("\n=== COMPLETE ===\n");

db.close();
