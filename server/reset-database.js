import { unlinkSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("\n=== RESETTING DATABASE ===\n");

// Delete all database files
const files = ["app.db", "app.db-wal", "app.db-shm"];
files.forEach(file => {
  const path = join(__dirname, file);
  if (existsSync(path)) {
    try {
      unlinkSync(path);
      console.log(`✅ Deleted ${file}`);
    } catch (e) {
      console.log(`❌ Could not delete ${file}: ${e.message}`);
      console.log("   Please stop the server first!");
      process.exit(1);
    }
  } else {
    console.log(`⏭️  ${file} doesn't exist`);
  }
});

console.log("\n✅ Database files deleted");
console.log("\n📝 Now run: node db.js");
console.log("   This will create a fresh database with all the changes\n");
