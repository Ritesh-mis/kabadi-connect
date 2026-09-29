// On-device material classifier (logistic regression on colour+edge features). Runs fully offline.
// Feature extraction MUST stay identical to ml/train.py -> features().
type Model = { size: number; classes: string[]; W: number[][]; b: number[]; meta?: any };
let model: Model | null = null;
export async function loadModel() {
  if (model) return model;
  try { model = await (await fetch("/model.json")).json(); } catch { model = null; }
  return model;
}
export function feats(px: Uint8ClampedArray, S: number) {
  const g = new Float32Array(S * S), h = new Float32Array(64);
  for (let i = 0; i < S * S; i++) {
    const r = px[i * 4] / 255, gg = px[i * 4 + 1] / 255, b = px[i * 4 + 2] / 255, q = (v: number) => Math.min(Math.floor(v * 4), 3);
    h[q(r) * 16 + q(gg) * 4 + q(b)] += 1 / (S * S);
    g[i] = (r + gg + b) / 3;
  }
  const e = new Float32Array(16);
  for (let y = 0; y < 60; y++) for (let x = 0; x < 60; x++)
    e[Math.floor(y / 15) * 4 + Math.floor(x / 15)] += (Math.abs(g[y * S + x + 1] - g[y * S + x]) + Math.abs(g[(y + 1) * S + x] - g[y * S + x])) * 4 / 225;
  let m = 0, v = 0; for (const x of g) m += x; m /= g.length; for (const x of g) v += (x - m) ** 2;
  return [...h, ...e, m, Math.sqrt(v / g.length)];
}
export async function classify(dataUrl: string): Promise<{ id: string; p: number }[] | null> {
  const M = await loadModel(); if (!M || !dataUrl) return null;
  const img = new Image(); img.src = dataUrl; await new Promise((r) => { img.onload = r; img.onerror = r; });
  const c = document.createElement("canvas"); c.width = c.height = M.size;
  const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, M.size, M.size);
  const f = feats(ctx.getImageData(0, 0, M.size, M.size).data, M.size);
  const z = M.W.map((w, k) => w.reduce((a, x, i) => a + x * f[i], M.b[k])), mx = Math.max(...z), ex = z.map((v) => Math.exp(v - mx)), s = ex.reduce((a, b) => a + b);
  return M.classes.map((id, k) => ({ id, p: ex[k] / s })).sort((a, b) => b.p - a.p).slice(0, 3);
}
