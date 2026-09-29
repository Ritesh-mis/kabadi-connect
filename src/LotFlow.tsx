import { useEffect, useState } from "react";
import { classify } from "./classifier";
import { get, post, enqueue, place, shrink, COLLECTOR } from "./api";

type Cat = { id: string; name: string; local_hi: string; local_mr: string; unit: string };
const L = (c: Cat, lang: string) => (lang === "हिंदी" ? c.local_hi : lang === "मराठी" ? c.local_mr : c.name);
const box: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 12, padding: 10, margin: "6px 0" };

export default function LotFlow({ lang, onClose, onDone }: { lang: string; onClose: () => void; onDone: (m: string) => void }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [cat, setCat] = useState("");
  const [img, setImg] = useState("");
  const [w, setW] = useState("");
  const [est, setEst] = useState<any>(null);
  const [lot, setLot] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [ho, setHo] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [pred, setPred] = useState<{ id: string; p: number }[]>([]);
  const step = ho ? 4 : lot ? 3 : 1;

  useEffect(() => { get("/categories").then((r) => setCats(r.data || [])); }, []);
  useEffect(() => {
    if (!cat || !+w) return setEst(null);
    const t = setTimeout(() => post("/estimate", { category_id: cat, weight_kg: +w }).then(setEst).catch(() => setEst(null)), 250);
    return () => clearTimeout(t);
  }, [cat, w]);

  async function photo(f?: File) {
    if (!f) return;
    const im = await shrink(f); setImg(im);
    const top = await classify(im);   // on-device, works offline
    if (top && top[0].p >= 0.5) { setCat(top[0].id); setPred(top); setNote(`AI: ${top[0].id} (${Math.round(top[0].p * 100)}%) - tap another chip to correct`); return; }
    if (top) { setPred(top); setNote(`AI unsure (best: ${top[0].id} ${Math.round(top[0].p * 100)}%) - please choose`); }
    try { const c = await post("/classify", { hint: f.name }); if (c.category_id) { setCat(c.category_id); setNote(`Suggested: ${c.category_id}`); } } catch { /* offline */ }
  }
  async function save() {
    setBusy(true);
    const p = await place(), data = { client_id: crypto.randomUUID(), collector_id: COLLECTOR, category_id: cat, weight_kg: +w, image: img, ml_label: pred[0]?.id, ml_conf: pred[0]?.p, ...p, collected_at: new Date().toISOString() };
    try { const r = await post("/lots", data); setLot(r.lot); setMatches(r.matches); }
    catch (e: any) {
      if (e.message === "Failed to fetch" || e instanceof TypeError) { enqueue({ type: "lot", client_id: data.client_id, data }); onDone("Saved offline - will sync automatically"); onClose(); }
      else setNote(e.message);
    }
    setBusy(false);
  }
  async function handover(rid: string) {
    setBusy(true);
    try { const p = await place(); setHo(await post("/handover", { lot_id: lot.id, recycler_id: rid, weight_kg: lot.weight_kg, photo: img, ...p })); onDone("Handover created"); }
    catch (e: any) { setNote(e.message); }
    setBusy(false);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="lot-modal" style={{ maxHeight: "92vh", overflow: "auto" }}>
        <div className="modal-head">
          <div><p className="modal-kicker">STEP {step === 4 ? 3 : step === 3 ? 2 : 1} OF 3</p><p className="modal-title">{step === 1 ? "Show us your material" : step === 3 ? "Choose a recycler" : "Handover ready"}</p></div>
          <div className="action modal-close" role="button" tabIndex={0} onClick={onClose}>✕</div>
        </div>
        {step === 1 && (<>
          <label className="upload-zone" style={{ display: "block", cursor: "pointer" }}>
            {img ? <img src={img} style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 10 }} /> : <p className="upload-title">📷 Take or add a photo</p>}
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => photo(e.target.files?.[0])} />
          </label>
          {note && <p style={{ fontSize: 13 }}>{note}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0" }}>
            {cats.map((c) => (
              <span key={c.id} className="action" role="button" tabIndex={0} onClick={() => setCat(c.id)}
                style={{ padding: "8px 12px", borderRadius: 20, border: "2px solid " + (cat === c.id ? "#16a34a" : "#ddd"), background: cat === c.id ? "#dcfce7" : "#fff" }}>{L(c, lang)}</span>))}
          </div>
          <input type="number" inputMode="decimal" placeholder="Weight (kg)" value={w} onChange={(e) => setW(e.target.value)} style={{ width: "100%", padding: 12, fontSize: 18, borderRadius: 10, border: "1px solid #ccc" }} />
          {est && <div style={{ ...box, background: "#f0fdf4" }}>Estimated value <b style={{ fontSize: 22 }}>₹{est.value}</b><br /><small>{JSON.stringify(est.range || "").replace(/[{}"]/g, "")}</small></div>}
        </>)}
        {step === 3 && matches.map((m) => (
          <div key={m.id} style={box}>
            <b>{m.name}</b> <small>{m.tag}</small><br />{m.distance_km} km · ₹{m.rate}/kg · <b>₹{m.offer_value}</b> {m.pickup ? "· 🚚 pickup" : ""}<br />
            <small>Auth: {m.auth_no}</small><br />
            <span className="action" role="button" tabIndex={0} onClick={() => handover(m.id)} style={{ display: "inline-block", marginTop: 6, padding: "8px 14px", background: "#16a34a", color: "#fff", borderRadius: 8 }}>Handover here</span>
          </div>))}
        {step === 3 && !matches.length && <p>No authorized recycler in range for this material.</p>}
        {step === 4 && (<div style={box}>
          <p>Show this reference to the recycler:</p>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>{ho.ref}</p>
          <small>Signed {ho.signature} · {new Date(ho.ts).toLocaleString()}</small>
        </div>)}
        {note && step !== 1 && <p style={{ color: "#b91c1c" }}>{note}</p>}
        <div className="modal-footer">
          <div className="action secondary-action" role="button" tabIndex={0} onClick={onClose}>{step === 4 ? "Done" : "Cancel"}</div>
          {step === 1 && <div className="action primary-compact" role="button" tabIndex={0} style={{ opacity: cat && +w && !busy ? 1 : 0.4 }} onClick={() => cat && +w && !busy && save()}>{busy ? "Saving…" : "Save lot & find buyers"}</div>}
        </div>
      </div>
    </div>
  );
}
