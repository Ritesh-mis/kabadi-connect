// API client with offline cache + offline op queue (synced via /api/sync)
const B = "/api";
const ls = (k: string, v?: unknown) => {
  try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
  return null;
};
export const COLLECTOR = "c1";
export const langName = (l: string) => (l === "हिंदी" ? "हिन्दी" : l);

export async function get<T = any>(path: string): Promise<{ data: T | null; offline: boolean }> {
  try {
    const r = await fetch(B + path);
    if (!r.ok) throw new Error(String(r.status));
    const data = await r.json();
    ls("c:" + path, data);
    return { data, offline: false };
  } catch { return { data: ls("c:" + path), offline: true }; }
}
export async function post<T = any>(path: string, body: unknown): Promise<T> {
  const r = await fetch(B + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "error");
  return d;
}
export const queue = () => (ls("kq") as any[]) || [];
export const enqueue = (op: any) => ls("kq", [...queue(), op]);
export async function flush(): Promise<number> {
  const ops = queue();
  if (!ops.length) return 0;
  const res = await post("/sync", { ops });
  const failed = new Set(res.results.filter((x: any) => !x.ok).map((x: any) => x.client_id));
  ls("kq", ops.filter((o) => failed.has(o.client_id) && false)); // drop processed ops (failed ones are validation errors, not retryable)
  return ops.length - failed.size;
}
export function place(): Promise<{ lat: number; lng: number }> {
  return new Promise((res) => {
    const d = { lat: 18.52, lng: 73.86 };
    if (!navigator.geolocation) return res(d);
    navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(d), { timeout: 4000 });
  });
}
export function shrink(file: File, max = 480): Promise<string> {
  return new Promise((res) => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = img.width * k; c.height = img.height * k;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(u); res(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => res("");
    img.src = u;
  });
}
export function say(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "English" ? "en-IN" : lang === "हिंदी" ? "hi-IN" : "mr-IN";
  window.speechSynthesis.speak(u);
}
