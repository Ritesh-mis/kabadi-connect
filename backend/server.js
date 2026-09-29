import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const SECRET = process.env.HANDOVER_SECRET || "sih-demo-secret";
const app = express();
app.use(cors());
app.use(express.json({ limit: "8mb" }));

const km = (a, b, c, d) => { const r = x => x * Math.PI / 180, h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const nid = p => p + "-" + crypto.randomBytes(3).toString("hex").toUpperCase();
const sign = s => crypto.createHmac("sha256", SECRET).update(s).digest("hex").slice(0, 16);
const cityOf = (lat, lng) => [["Pune", 18.52, 73.86], ["Mumbai", 19.08, 72.88], ["Nashik", 20.0, 73.79]].map(c => [c[0], km(lat, lng, c[1], c[2])]).sort((a, b) => a[1] - b[1])[0][0];

// ---- price discovery ----
function priceBoard(loc) {
  return db.prepare("SELECT c.id,c.name,c.local_hi,c.local_mr,c.unit,p.buy_price rate,p.range_low,p.range_high,p.date FROM categories c JOIN prices p ON p.category_id=c.id AND p.location=? AND p.date=(SELECT MAX(date) FROM prices WHERE location=?)").all(loc, loc)
    .map(r => { const past = db.prepare("SELECT buy_price FROM prices WHERE category_id=? AND location=? ORDER BY date DESC LIMIT 1 OFFSET 7").get(r.id, loc); const chg = past ? +((r.rate - past.buy_price) / past.buy_price * 100).toFixed(1) : 0; return { ...r, change_pct: chg, trend: chg > 0.5 ? "up" : chg < -0.5 ? "down" : "flat" }; });
}
app.get("/api/prices", (q, s) => s.json(priceBoard(q.query.location || "Pune")));
app.get("/api/prices/history", (q, s) => s.json(db.prepare("SELECT date,buy_price,quoted_price,range_low,range_high FROM prices WHERE category_id=? AND location=? ORDER BY date").all(q.query.category, q.query.location || "Pune")));
app.get("/api/prices/speak", (q, s) => { // text for on-device TTS in chosen language
  const lang = q.query.lang || "English", b = priceBoard(q.query.location || "Pune").slice(0, 4);
  const line = r => lang === "मराठी" ? `${r.local_mr}, ${r.rate} रुपये प्रति ${r.unit}` : lang === "हिन्दी" ? `${r.local_hi}, ${r.rate} रुपये प्रति ${r.unit}` : `${r.name}, ${r.rate} rupees per ${r.unit}`;
  s.json({ text: b.map(line).join(". ") });
});
app.get("/api/ml/stats", (q, s) => { // model accuracy in the field: prediction vs collector's final choice
  const r = db.prepare("SELECT count(*) n, sum(ml_label=category_id) ok FROM lots WHERE ml_label IS NOT NULL").get();
  s.json({ predictions: r.n, correct: r.ok || 0, field_accuracy: r.n ? +((r.ok || 0) / r.n).toFixed(3) : null, labelled_images: db.prepare("SELECT count(*) n FROM lots WHERE image LIKE 'data:image%'").get().n });
});
app.get("/api/categories", (q, s) => s.json(db.prepare("SELECT * FROM categories").all()));

// ---- valuation + classification ----
function estimate(cat, w, loc) {
  const p = db.prepare("SELECT buy_price,range_low,range_high FROM prices WHERE category_id=? AND location=? ORDER BY date DESC LIMIT 1").get(cat, loc);
  if (!p) return null;
  return { rate: p.buy_price, value: Math.round(p.buy_price * w), low: Math.round(p.range_low * w), high: Math.round(p.range_high * w) };
}
app.post("/api/estimate", (q, s) => { const { category_id, weight_kg, location = "Pune" } = q.body; const e = estimate(category_id, +weight_kg, location); e ? s.json(e) : s.status(400).json({ error: "unknown category" }); });
// Classifier: prototype placeholder. Uses client on-device label if given, else filename keywords. Swap for a TFLite/ONNX model.
app.post("/api/classify", (q, s) => {
  const { hint = "", ml_label } = q.body; const t = (ml_label || hint).toLowerCase();
  const map = { cable: "copper_cable", wire: "copper_cable", batter: "li_battery", pcb: "pcb", board: "pcb", phone: "mobile", crt: "crt", lcd: "lcd", panel: "lcd", motor: "motor_magnet", magnet: "motor_magnet", plastic: "mixed_plastic" };
  const k = Object.keys(map).find(k => t.includes(k));
  s.json(k ? { category_id: map[k], confidence: ml_label ? 0.9 : 0.6, method: ml_label ? "on-device-model" : "keyword" } : { category_id: null, confidence: 0, method: "none" });
});

// ---- recycler matching ----
function match(cat, lat, lng, w) {
  return db.prepare("SELECT r.*,rr.rate FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id=r.id AND rr.category_id=? WHERE r.auth_status='active'").all(cat)
    .map(r => ({ r, d: km(lat, lng, r.lat, r.lng) })).filter(x => x.d <= x.r.service_km)
    .map(({ r, d }) => ({ id: r.id, name: r.name, phone: r.phone, auth_no: r.auth_no, rating: r.rating, distance_km: +d.toFixed(1), rate: r.rate, pickup: !!r.pickup, offer_value: Math.round(r.rate * w), score: r.rate / 10 - d * 1.5 + (r.pickup ? 6 : 0) + r.rating * 2 }))
    .sort((a, b) => b.score - a.score).map((x, i) => ({ ...x, tag: i === 0 ? "Best match" : x.pickup ? "Pickup" : "Drop-off" }));
}
app.get("/api/recyclers", (q, s) => s.json(db.prepare("SELECT id,name,city,materials,auth_no,auth_status,phone,pickup,service_km,rating FROM recyclers").all()));
app.get("/api/match", (q, s) => { const { category_id, lat = 18.52, lng = 73.86, weight_kg = 1 } = q.query; s.json(match(category_id, +lat, +lng, +weight_kg)); });

// ---- anomaly detection: z-score of unit price vs 60-day history ----
function anomaly(cat, loc, unit) {
  const h = db.prepare("SELECT buy_price FROM prices WHERE category_id=? AND location=?").all(cat, loc).map(x => x.buy_price);
  if (h.length < 10) return null;
  const m = h.reduce((a, b) => a + b) / h.length, sd = Math.sqrt(h.reduce((a, b) => a + (b - m) ** 2, 0) / h.length) || 1, z = (unit - m) / sd;
  return Math.abs(z) > 3 && Math.abs(unit - m) / m > 0.2 ? `unit price ${unit} is ${z.toFixed(1)} std-dev from mean ${m.toFixed(0)}` : null;
}

// ---- lots (idempotent via client_id so offline retries are safe) ----
function createLot(b) {
  const ex = b.client_id && db.prepare("SELECT * FROM lots WHERE client_id=?").get(b.client_id); if (ex) return ex;
  const loc = b.location || cityOf(b.lat ?? 18.52, b.lng ?? 73.86), e = estimate(b.category_id, +b.weight_kg, loc);
  if (!e) throw new Error("unknown category or price");
  const id = nid("LOT");
  db.prepare("INSERT INTO lots(id,client_id,collector_id,category_id,description,condition,source_type,weight_kg,est_value,image,lat,lng,location,collected_at,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(id, b.client_id || null, b.collector_id || "c1", b.category_id, b.description || "", b.condition || "mixed", b.source_type || "household", +b.weight_kg, e.value, b.image || null, b.lat ?? 18.52, b.lng ?? 73.86, loc, b.collected_at || new Date().toISOString(), "listed");
  if (b.ml_label) db.prepare("UPDATE lots SET ml_label=?,ml_conf=? WHERE id=?").run(String(b.ml_label), +b.ml_conf || null, id);
  return db.prepare("SELECT * FROM lots WHERE id=?").get(id);
}
const slim = l => ({ ...l, image: l.image ? "yes" : null });
app.post("/api/lots", (q, s) => { try { const l = createLot(q.body); s.json({ lot: slim(l), matches: match(l.category_id, l.lat, l.lng, l.weight_kg) }); } catch (e) { s.status(400).json({ error: e.message }); } });
app.get("/api/lots", (q, s) => s.json(db.prepare("SELECT l.*,c.name category,r.name recycler FROM lots l JOIN categories c ON c.id=l.category_id LEFT JOIN recyclers r ON r.id=l.recycler_id WHERE collector_id=? ORDER BY created_at DESC").all(q.query.collector || "c1").map(slim)));

// ---- handover: signed, verifiable record ----
function handover(b) {
  const lot = db.prepare("SELECT * FROM lots WHERE id=?").get(b.lot_id); if (!lot) throw new Error("lot not found");
  const old = db.prepare("SELECT * FROM handovers WHERE lot_id=?").get(lot.id); if (old) return old;
  const rec = db.prepare("SELECT r.*,rr.rate FROM recyclers r JOIN recycler_rates rr ON rr.recycler_id=r.id AND rr.category_id=? WHERE r.id=? AND r.auth_status='active'").get(lot.category_id, b.recycler_id);
  if (!rec) throw new Error("recycler not authorized for this material");
  const ref = nid("HO"), ts = b.ts || new Date().toISOString(), w = +b.weight_kg || lot.weight_kg, hl = b.lat ?? lot.lat, hn = b.lng ?? lot.lng;
  const sig = sign([ref, lot.id, rec.id, w, hl, hn, ts].join("|"));
  db.prepare("INSERT INTO handovers(ref,lot_id,recycler_id,weight_kg,lat,lng,ts,photo,signature) VALUES(?,?,?,?,?,?,?,?,?)").run(ref, lot.id, rec.id, w, hl, hn, ts, b.photo || null, sig);
  const quoted = Math.round(rec.rate * w);
  db.prepare("UPDATE lots SET recycler_id=?,quoted_price=?,status='handover_pending',payment_status='pending' WHERE id=?").run(rec.id, quoted, lot.id);
  return db.prepare("SELECT * FROM handovers WHERE ref=?").get(ref);
}
app.post("/api/handover", (q, s) => { try { s.json(handover(q.body)); } catch (e) { s.status(400).json({ error: e.message }); } });
app.get("/api/verify/:ref", (q, s) => {
  const h = db.prepare("SELECT * FROM handovers WHERE ref=?").get(q.params.ref); if (!h) return s.status(404).json({ valid: false });
  const ok = sign([h.ref, h.lot_id, h.recycler_id, h.weight_kg, h.lat, h.lng, h.ts].join("|")) === h.signature;
  const lot = db.prepare("SELECT id,category_id,weight_kg,quoted_price,status,payment_status FROM lots WHERE id=?").get(h.lot_id);
  s.json({ valid: ok, confirmed: !!h.confirmed, handover: { ref: h.ref, ts: h.ts, lat: h.lat, lng: h.lng, weight_kg: h.weight_kg }, lot });
});

// ---- recycler side ----
const auth = (q, s, n) => { const r = db.prepare("SELECT * FROM recyclers WHERE id=? AND pin=?").get(q.headers["x-recycler-id"], q.headers["x-recycler-pin"]); if (!r) return s.status(401).json({ error: "bad recycler credentials" }); q.recycler = r; n(); };
app.get("/api/recycler/pending", auth, (q, s) => s.json(db.prepare("SELECT h.ref,h.weight_kg,h.ts,l.id lot_id,l.category_id,l.quoted_price,l.image,c.name category FROM handovers h JOIN lots l ON l.id=h.lot_id JOIN categories c ON c.id=l.category_id WHERE h.recycler_id=? AND h.confirmed=0").all(q.recycler.id)));
app.post("/api/recycler/confirm", auth, (q, s) => {
  const { ref, final_weight, paid = true, payment_mode = "cash" } = q.body;
  const h = db.prepare("SELECT * FROM handovers WHERE ref=? AND recycler_id=?").get(ref, q.recycler.id); if (!h) return s.status(404).json({ error: "not found" });
  const lot = db.prepare("SELECT * FROM lots WHERE id=?").get(h.lot_id), rate = db.prepare("SELECT rate FROM recycler_rates WHERE recycler_id=? AND category_id=?").get(q.recycler.id, lot.category_id).rate;
  const w = +final_weight || h.weight_kg, final = Math.round(rate * w), an = anomaly(lot.category_id, lot.location, final / w) || (Math.abs(w - lot.weight_kg) / lot.weight_kg > 0.3 ? `weight differs ${lot.weight_kg}kg -> ${w}kg` : null);
  db.prepare("UPDATE handovers SET confirmed=1,confirmed_at=?,final_weight=? WHERE ref=?").run(new Date().toISOString(), w, ref);
  db.prepare("UPDATE lots SET final_value=?,status='completed',payment_status=?,payment_mode=?,anomaly=?,anomaly_reason=? WHERE id=?").run(final, paid ? "paid" : "pending", payment_mode, an ? 1 : 0, an, lot.id);
  s.json({ ok: true, final_value: final, anomaly: an });
});
app.post("/api/recycler/rates", auth, (q, s) => { const { category_id, rate } = q.body; db.prepare("INSERT OR REPLACE INTO recycler_rates(recycler_id,category_id,rate,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP)").run(q.recycler.id, category_id, +rate); db.prepare("INSERT INTO prices(category_id,location,date,buy_price,quoted_price,range_low,range_high,unit,recycler_id) VALUES(?,?,?,?,?,?,?,?,?)").run(category_id, q.recycler.city, new Date().toISOString().slice(0, 10), +rate, +rate, +rate * .9, +rate * 1.1, "kg", q.recycler.id); s.json({ ok: true }); });

// ---- offline batch sync ----
app.post("/api/sync", (q, s) => {
  const out = [];
  for (const op of q.body.ops || []) try { out.push({ client_id: op.client_id, ok: true, result: op.type === "lot" ? slim(createLot(op.data)) : handover(op.data) }); } catch (e) { out.push({ client_id: op.client_id, ok: false, error: e.message }); }
  s.json({ results: out, server_time: new Date().toISOString() });
});

// ---- ledger / dashboard ----
app.get("/api/ledger", (q, s) => {
  const c = q.query.collector || "c1", rows = db.prepare("SELECT id,category_id,weight_kg,final_value,quoted_price,payment_status,payment_mode,status,collected_at FROM lots WHERE collector_id=? ORDER BY collected_at DESC").all(c);
  const sum = (f) => rows.filter(f).reduce((a, r) => a + (r.final_value ?? r.quoted_price ?? 0), 0);
  s.json({ total_earned: sum(r => r.payment_status === "paid"), pending: sum(r => r.payment_status === "pending"), kg_recycled: rows.filter(r => r.status === "completed").reduce((a, r) => a + r.weight_kg, 0), handovers: rows.filter(r => r.status === "completed").length, rows });
});
app.get("/api/safety", (q, s) => s.json(db.prepare("SELECT id,name,local_hi,local_mr,hazard FROM categories").all()));

// ---- datasets export ----
app.get("/api/datasets/:n.csv", (q, s) => {
  const t = { materials: "SELECT id,category_id,description,condition,source_type,weight_kg,est_value FROM lots", prices: "SELECT * FROM prices", recyclers: "SELECT id,name,city,materials,auth_no,auth_status,phone,pickup,service_km FROM recyclers", transactions: "SELECT id,collector_id,category_id,weight_kg,quoted_price,final_value,recycler_id,location,payment_status,status,anomaly,collected_at FROM lots", traceability: "SELECT h.*,l.status FROM handovers h JOIN lots l ON l.id=h.lot_id" }[q.params.n];
  if (!t) return s.status(404).end();
  const rows = db.prepare(t).all(); if (!rows.length) return s.type("text/csv").send("");
  const k = Object.keys(rows[0]).filter(x => x !== "photo");
  s.type("text/csv").send([k.join(","), ...rows.map(r => k.map(x => JSON.stringify(r[x] ?? "")).join(","))].join("\n"));
});
// unit economics (simple, assumption-driven)
app.get("/api/economics", (q, s) => { const n = (k, d) => (q.query[k] !== undefined && !isNaN(+q.query[k]) ? +q.query[k] : d); const kg = n("kg_month", 100), base = n("price", 193), informal = n("informal", 0.7), fee = n("fee", 0.03), trip = n("trip_cost", 200), now = kg * base * informal, plat = kg * base; s.json({ assumptions: { kg_month: kg, avg_rate_per_kg: base, informal_share_of_fair_price: informal, platform_fee_from_recycler: fee, extra_transport: trip }, collector_monthly_now: Math.round(now), collector_monthly_platform: Math.round(plat - trip), uplift_pct: Math.round(((plat - trip) / now - 1) * 100), platform_revenue_per_collector: Math.round(plat * fee) }); });

app.get("/recycler", (q, s) => s.sendFile(fileURLToPath(new URL("./recycler.html", import.meta.url))));
app.listen(process.env.PORT || 3001, () => console.log("API on :3001  |  recycler portal: http://localhost:3001/recycler"));