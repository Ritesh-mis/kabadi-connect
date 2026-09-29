import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(path.join(dir, "kabadi.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS collectors(id TEXT PRIMARY KEY, name TEXT, language TEXT DEFAULT 'English', area TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY, name TEXT, sub_category TEXT, local_hi TEXT, local_mr TEXT, unit TEXT DEFAULT 'kg', hazard TEXT);
CREATE TABLE IF NOT EXISTS recyclers(id TEXT PRIMARY KEY, name TEXT, city TEXT, lat REAL, lng REAL, materials TEXT, auth_no TEXT, auth_status TEXT, phone TEXT, pickup INTEGER, service_km REAL, rating REAL, pin TEXT);
CREATE TABLE IF NOT EXISTS recycler_rates(recycler_id TEXT, category_id TEXT, rate REAL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(recycler_id, category_id));
CREATE TABLE IF NOT EXISTS prices(id INTEGER PRIMARY KEY AUTOINCREMENT, category_id TEXT, location TEXT, date TEXT, buy_price REAL, quoted_price REAL, range_low REAL, range_high REAL, unit TEXT, recycler_id TEXT);
CREATE INDEX IF NOT EXISTS ix_prices ON prices(category_id, location, date);
CREATE TABLE IF NOT EXISTS lots(id TEXT PRIMARY KEY, client_id TEXT UNIQUE, collector_id TEXT, category_id TEXT, description TEXT, condition TEXT, source_type TEXT, weight_kg REAL, est_value REAL, quoted_price REAL, final_value REAL, image TEXT, lat REAL, lng REAL, location TEXT, collected_at TEXT, recycler_id TEXT, payment_status TEXT DEFAULT 'none', payment_mode TEXT, status TEXT DEFAULT 'draft', anomaly INTEGER DEFAULT 0, anomaly_reason TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS handovers(ref TEXT PRIMARY KEY, lot_id TEXT, recycler_id TEXT, weight_kg REAL, lat REAL, lng REAL, ts TEXT, photo TEXT, signature TEXT, confirmed INTEGER DEFAULT 0, confirmed_at TEXT, final_weight REAL);
`);
for (const c of ["ml_label TEXT","ml_conf REAL"]) try { db.exec("ALTER TABLE lots ADD COLUMN " + c); } catch {}
