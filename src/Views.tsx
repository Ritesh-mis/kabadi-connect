import { useEffect, useState } from "react";
import { get, say, langName } from "./api";
import Safety from "./Safety";

const P: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, margin: "8px 0", background: "#fff" };
const Big = ({ children }: { children: React.ReactNode }) => <b style={{ fontSize: 22 }}>{children}</b>;

function Spark({ cat }: { cat: string }) {
  const [h, setH] = useState<number[]>([]);
  useEffect(() => { get("/prices/history?category=" + cat).then((r) => setH((r.data || []).map((x: any) => x.buy_price))); }, [cat]);
  if (h.length < 2) return null;
  const mn = Math.min(...h), mx = Math.max(...h) || 1, pts = h.map((v, i) => `${(i / (h.length - 1)) * 120},${30 - ((v - mn) / (mx - mn || 1)) * 28}`).join(" ");
  return <svg width="120" height="32"><polyline fill="none" stroke="#16a34a" strokeWidth="2" points={pts} /></svg>;
}

export default function Views({ view, lang }: { view: string; lang: string }) {
  const [d, setD] = useState<any>(null);
  const [eco, setEco] = useState<any>(null);
  useEffect(() => {
    setD(null);
    const path = { "My lots": "/lots?collector=c1", "Price board": "/prices", Recyclers: "/recyclers", Earnings: "/ledger", }[view];
    if (path) get(path).then((r) => setD(r.data));
    if (view === "Earnings") get("/economics?kg_month=100").then((r) => setEco(r.data));
  }, [view]);
  if (view === "Safety") return <Safety lang={lang} />;
  if (!d) return <p style={{ padding: 20 }}>Loading…</p>;
  const nm = (c: any) => (lang === "हिंदी" ? c.local_hi : lang === "मराठी" ? c.local_mr : c.name);

  if (view === "My lots") return <div>{d.map((l: any) => (
    <div key={l.id} style={P}><b>{l.category}</b> · {l.weight_kg} kg <span style={{ float: "right" }}><Big>₹{l.final_value ?? l.quoted_price ?? l.est_value}</Big></span><br />
      <small>{l.id} · {l.recycler || "no recycler yet"} · {l.status.replace("_", " ")} · {l.payment_status}{l.anomaly ? " · ⚠ flagged" : ""}</small></div>))}
    {!d.length && <p>No lots yet.</p>}</div>;

  if (view === "Price board") return <div>
    <div onClick={() => get(`/prices/speak?lang=${encodeURIComponent(langName(lang))}`).then((r) => r.data && say(r.data.text, lang))} style={{ ...P, cursor: "pointer", background: "#f0fdf4" }}>🔊 Hear today's prices</div>
    {d.map((p: any) => (<div key={p.id} style={{ ...P, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ flex: 1 }}><b>{nm(p)}</b><br /><small>Range ₹{Math.round(p.range_low)}–{Math.round(p.range_high)} / {p.unit}</small></div>
      <Spark cat={p.id} /><div style={{ textAlign: "right" }}><Big>₹{p.rate}</Big><br /><small style={{ color: p.trend === "up" ? "#16a34a" : "#dc2626" }}>{p.trend === "up" ? "▲" : "▼"} {p.change_pct}%</small></div></div>))}</div>;

  if (view === "Recyclers") return <div>{d.map((r: any) => (
    <div key={r.id} style={P}><b>{r.name}</b> ⭐{r.rating} <span style={{ float: "right", color: r.auth_status === "active" ? "#16a34a" : "#dc2626" }}>✔ {r.auth_status}</span><br />
      <small>{r.city} · service {r.service_km} km · {r.pickup ? "pickup available" : "drop-off only"}<br />Auth {r.auth_no} · 📞 {r.phone}</small></div>))}</div>;

  if (view === "Earnings") return <div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
      <div style={P}><small>Paid</small><br /><Big>₹{d.total_earned}</Big></div><div style={P}><small>Pending</small><br /><Big>₹{d.pending}</Big></div>
      <div style={P}><small>Recycled</small><br /><Big>{d.kg_recycled} kg</Big></div><div style={P}><small>Handovers</small><br /><Big>{d.handovers}</Big></div></div>
    {eco && <div style={{ ...P, background: "#f0fdf4" }}><b>Unit economics (100 kg/month, assumptions)</b><br />Informal today ₹{eco.collector_monthly_now} → platform ₹{eco.collector_monthly_platform} (<b>+{eco.uplift_pct}%</b>)<br /><small>Platform revenue/collector: ₹{eco.platform_revenue_per_collector}/month (3% recycler fee)</small></div>}
    {d.rows.map((r: any) => <div key={r.id} style={P}>{r.id} · {r.weight_kg} kg <span style={{ float: "right" }}>₹{r.final_value ?? r.quoted_price} · {r.payment_status}</span></div>)}</div>;

  if (view === "Safety") return <div>{d.map((s: any) => (
    <div key={s.id} style={{ ...P, display: "flex", gap: 10, alignItems: "center" }}><span style={{ fontSize: 28 }}>⚠️</span>
      <div style={{ flex: 1 }}><b>{nm(s)}</b><br />{s.hazard}</div>
      <span style={{ cursor: "pointer", fontSize: 24 }} onClick={() => say(`${nm(s)}. ${s.hazard}`, lang)}>🔊</span></div>))}</div>;
  return null;
}
