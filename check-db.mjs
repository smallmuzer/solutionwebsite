import Database from 'better-sqlite3';
import { resolve } from 'path';
const db = new Database(resolve('server/app.db'));
const tables = ['services','products','testimonials','career_jobs','client_logos','site_content','appointments'];
for (const t of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    const sample = db.prepare(`SELECT * FROM ${t} LIMIT 1`).get();
    console.log(`\n=== ${t}: ${count.c} rows ===`);
    if (sample) console.log(JSON.stringify(sample, null, 2));
  } catch(e) { console.log(`${t}: ERROR - ${e.message}`); }
}
