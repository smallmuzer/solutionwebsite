import Database from "better-sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { copyFileSync, unlinkSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "app.db");
const backupPath = join(__dirname, "app.db.backup");

console.log("\n=== CONVERTING DATABASE TO DELETE MODE ===\n");

// Create backup
console.log("📦 Creating backup...");
copyFileSync(dbPath, backupPath);
console.log(`✅ Backup created: ${backupPath}`);

// Open database
const db = new Database(dbPath);

// Checkpoint WAL to ensure all data is in main file
console.log("\n📝 Checkpointing WAL...");
db.pragma("wal_checkpoint(TRUNCATE)");
console.log("✅ WAL checkpointed");

// Convert to DELETE mode (no WAL)
console.log("\n🔄 Converting to DELETE journal mode...");
db.pragma("journal_mode = DELETE");
console.log("✅ Converted to DELETE mode");

// Vacuum to compact database
console.log("\n🗜️  Vacuuming database...");
db.exec("VACUUM");
console.log("✅ Database vacuumed");

// Verify the change
const journalMode = db.pragma("journal_mode", { simple: true });
console.log(`\n📊 Current journal mode: ${journalMode}`);

// Show final state
console.log("\n=== FINAL STATE ===\n");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("📋 All Tables:");
tables.forEach(t => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`  - ${t.name} (${count.c} rows)`);
});

const userRolesExists = tables.some(t => t.name === 'user_roles');
console.log(`\n${userRolesExists ? '❌' : '✅'} user_roles table: ${userRolesExists ? 'EXISTS' : 'REMOVED'}`);

const users = db.prepare("SELECT id, email, userrole FROM users").all();
console.log(`\n👥 Users (${users.length}):`);
users.forEach(u => console.log(`  - ${u.email} (${u.userrole})`));

db.close();

// Try to delete WAL and SHM files
console.log("\n🧹 Cleaning up WAL files...");
const walPath = dbPath + "-wal";
const shmPath = dbPath + "-shm";

try {
  if (existsSync(walPath)) {
    unlinkSync(walPath);
    console.log("✅ Deleted app.db-wal");
  } else {
    console.log("✅ app.db-wal doesn't exist");
  }
} catch (e) {
  console.log("⚠️  Could not delete app.db-wal (may be locked by server)");
}

try {
  if (existsSync(shmPath)) {
    unlinkSync(shmPath);
    console.log("✅ Deleted app.db-shm");
  } else {
    console.log("✅ app.db-shm doesn't exist");
  }
} catch (e) {
  console.log("⚠️  Could not delete app.db-shm (may be locked by server)");
}

console.log("\n=== COMPLETE ===");
console.log("\n✅ Database is now in DELETE mode (no WAL)");
console.log("✅ All changes are in the main app.db file");
console.log("✅ You can now upload app.db to https://sqliteviewer.app/");
console.log("\n📁 Database file: " + dbPath);
console.log("📁 Backup file: " + backupPath);
console.log("\n");
