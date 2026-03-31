/**
 * Pure in-memory database backed by localStorage JSON.
 * No WASM, no external dependencies. Replaces sql.js entirely.
 */

const STORAGE_KEY = "app_db_v1";

export type Row = Record<string, any>;
type TableStore = Record<string, Row[]>;

let _db: TableStore | null = null;

const TABLES = [
  "contact_submissions",
  "users",
  "site_content",
  "testimonials",
  "seo_settings",
  "services",
  "client_logos",
  "career_jobs",
];

const t0 = new Date().toISOString();

const SEED: Partial<TableStore> = {
  services: [
    { id: "svc-1", title: "Software Development", description: "Custom enterprise software built to your exact specifications — scalable, secure, and maintainable.", image_url: null, is_visible: true, sort_order: 0, created_at: t0, updated_at: t0 },
    { id: "svc-2", title: "Web Development", description: "Modern, responsive websites and web applications using the latest frameworks and best practices.", image_url: null, is_visible: true, sort_order: 1, created_at: t0, updated_at: t0 },
    { id: "svc-3", title: "Mobile App Development", description: "Native and cross-platform mobile apps for iOS and Android that deliver exceptional user experiences.", image_url: null, is_visible: true, sort_order: 2, created_at: t0, updated_at: t0 },
    { id: "svc-4", title: "ERP Solutions", description: "End-to-end ERP implementation and integration — finance, inventory, procurement, and operations unified.", image_url: null, is_visible: true, sort_order: 3, created_at: t0, updated_at: t0 },
    { id: "svc-5", title: "HR & Payroll Systems", description: "Streamline hiring, attendance, payroll, and performance management with our HR platform.", image_url: null, is_visible: true, sort_order: 4, created_at: t0, updated_at: t0 },
    { id: "svc-6", title: "IT Consulting", description: "Strategic technology consulting to align your IT infrastructure with your business goals.", image_url: null, is_visible: true, sort_order: 5, created_at: t0, updated_at: t0 },
    { id: "svc-7", title: "SEO & Digital Marketing", description: "Data-driven SEO strategies and digital marketing campaigns that grow your online presence.", image_url: null, is_visible: true, sort_order: 6, created_at: t0, updated_at: t0 },
    { id: "svc-8", title: "UI/UX Design", description: "Beautiful, intuitive interfaces designed with your users in mind — from wireframes to pixel-perfect delivery.", image_url: null, is_visible: true, sort_order: 7, created_at: t0, updated_at: t0 },
    { id: "svc-9", title: "Cloud & Infrastructure", description: "Cloud migration, DevOps pipelines, and managed infrastructure to keep your systems fast and reliable.", image_url: null, is_visible: true, sort_order: 8, created_at: t0, updated_at: t0 },
  ],
  testimonials: [
    { id: "tst-1", name: "Ahmed Rasheed", company: "Villa Group", message: "Systems Solutions transformed our operations with their ERP system. The team was professional, responsive, and delivered exactly what we needed.", avatar_url: "/assets/testimonials/ahmed.jpg", rating: 5, is_visible: true, created_at: t0, updated_at: t0 },
    { id: "tst-2", name: "Fatima Zahir", company: "OBLU Resorts", message: "Their web development team built us a stunning booking platform. Traffic and conversions have increased significantly since launch.", avatar_url: "/assets/testimonials/fatima.jpg", rating: 5, is_visible: true, created_at: t0, updated_at: t0 },
    { id: "tst-3", name: "Dorji Wangchuk", company: "RCSC Bhutan", message: "Excellent consulting services. They understood our requirements perfectly and delivered a robust HR system on time and within budget.", avatar_url: "/assets/testimonials/dorji.jpg", rating: 5, is_visible: true, created_at: t0, updated_at: t0 },
  ],
  career_jobs: [
    { id: "job-1", title: "Senior Full Stack Developer", description: "We are looking for an experienced Full Stack Developer proficient in React, Node.js, and cloud technologies to join our growing team.", location: "Malé, Maldives", job_type: "Full-time", is_visible: true, sort_order: 0, created_at: t0, updated_at: t0 },
    { id: "job-2", title: "UI/UX Designer", description: "Creative designer with strong Figma skills and a portfolio of web/mobile projects. You will work closely with our development team.", location: "Malé, Maldives", job_type: "Full-time", is_visible: true, sort_order: 1, created_at: t0, updated_at: t0 },
    { id: "job-3", title: "Business Development Executive", description: "Drive growth by identifying new business opportunities, building client relationships, and closing deals across the Maldives and Bhutan.", location: "Malé, Maldives", job_type: "Full-time", is_visible: true, sort_order: 2, created_at: t0, updated_at: t0 },
  ],
  seo_settings: [
    { id: "seo-1", page_key: "home", title: "Systems Solutions - Leading IT Company in Maldives", description: "Transform your business with cutting-edge technology solutions. Software development, ERP, mobile apps, and IT consulting.", keywords: "IT solutions, Maldives, software development, ERP, web development", og_image: "", updated_at: t0, updated_by: null },
  ],
};

function saveDb() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
  } catch { /* quota exceeded */ }
}

function loadDb(): TableStore {
  if (_db) return _db;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all tables exist
      TABLES.forEach((t) => { if (!parsed[t]) parsed[t] = []; });
      // Seed any table that is still empty and has seed data
      let dirty = false;
      for (const [table, rows] of Object.entries(SEED)) {
        if (!parsed[table] || parsed[table].length === 0) {
          parsed[table] = rows;
          dirty = true;
        }
      }
      _db = parsed;
      if (dirty) saveDb();
      return _db!;
    }
  } catch { /* corrupt data — reset */ }
  // Fresh DB — seed everything
  _db = Object.fromEntries(TABLES.map((t) => [t, (SEED as any)[t] || []])) as TableStore;
  saveDb();
  return _db;
}

export function getTable(table: string): Row[] {
  const db = loadDb();
  if (!db[table]) db[table] = [];
  return db[table];
}

export function setTable(table: string, rows: Row[]) {
  const db = loadDb();
  db[table] = rows;
  saveDb();
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}
