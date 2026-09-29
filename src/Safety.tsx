import { say } from "./api";

type T = Record<string, string>;
const cards: { k: string; no: T; yes: T; emoji: string }[] = [
  { k: "cable", emoji: "✂️",
    no: { English: "Never burn cables. The smoke is poisonous.", हिंदी: "तार कभी न जलाएं। धुआं ज़हरीला होता है।", मराठी: "तारा कधीही जाळू नका. धूर विषारी असतो." },
    yes: { English: "Strip cables by hand, or sell them with the plastic on.", हिंदी: "तार हाथ से छीलें या प्लास्टिक समेत बेचें।", मराठी: "तारा हाताने सोलून घ्या किंवा प्लास्टिकसह विका." } },
  { k: "battery", emoji: "🔋",
    no: { English: "Never open, crush or puncture batteries. They can catch fire.", हिंदी: "बैटरी को कभी खोलें, दबाएं या छेदें नहीं। आग लग सकती है।", मराठी: "बॅटरी कधीही उघडू, दाबू किंवा टोचू नका. आग लागू शकते." },
    yes: { English: "Keep batteries whole, dry, and away from metal.", हिंदी: "बैटरी साबुत, सूखी और धातु से दूर रखें।", मराठी: "बॅटरी अखंड, कोरड्या आणि धातूपासून दूर ठेवा." } },
  { k: "crt", emoji: "📺",
    no: { English: "Never break a TV picture tube. Glass and lead dust are dangerous.", हिंदी: "टीवी की पिक्चर ट्यूब कभी न तोड़ें। कांच और सीसे की धूल खतरनाक है।", मराठी: "टीव्हीची पिक्चर ट्यूब कधीही फोडू नका. काच आणि शिशाची धूळ धोकादायक आहे." },
    yes: { English: "Carry it with both hands and hand it over whole.", हिंदी: "दोनों हाथों से उठाएं और साबुत ही दें।", मराठी: "दोन्ही हातांनी उचला आणि अखंडच द्या." } },
  { k: "pcb", emoji: "💰",
    no: { English: "Never put circuit boards in acid. It burns skin and poisons water.", हिंदी: "सर्किट बोर्ड को तेज़ाब में न डालें। यह त्वचा जलाता है और पानी ज़हरीला करता है।", मराठी: "सर्किट बोर्ड आम्लात टाकू नका. ते त्वचा जाळते आणि पाणी विषारी करते." },
    yes: { English: "Sell boards as they are. The recycler pays for the gold.", हिंदी: "बोर्ड जैसे हैं वैसे बेचें। रीसाइक्लर सोने का दाम देता है।", मराठी: "बोर्ड जसे आहेत तसे विका. रीसायकलर सोन्याचे पैसे देतो." } },
  { k: "child", emoji: "🧤",
    no: { English: "Do not let children play near scrap.", हिंदी: "बच्चों को कबाड़ के पास न आने दें।", मराठी: "मुलांना भंगाराजवळ येऊ देऊ नका." },
    yes: { English: "Wear gloves. Keep scrap away from children and food.", हिंदी: "दस्ताने पहनें। कबाड़ को बच्चों और खाने से दूर रखें।", मराठी: "हातमोजे घाला. भंगार मुलांपासून आणि जेवणापासून दूर ठेवा." } },
];
const title: T = { English: "Stay safe", हिंदी: "सुरक्षित रहें", मराठी: "सुरक्षित रहा" };
const dont: T = { English: "DON'T", हिंदी: "न करें", मराठी: "करू नका" };
const doo: T = { English: "DO", हिंदी: "करें", मराठी: "करा" };

function Scene({ k }: { k: string }) {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-hidden="true">
      {k === "cable" && <>
        {[42, 33, 24].map((r) => <circle key={r} cx="60" cy="78" r={r / 1.6} fill="none" stroke="#c2703a" strokeWidth="6" />)}
        <path d="M60 52c-14-8 2-16-8-26 14 2 12 12 18 14 4-6 2-10 0-14 14 8 12 22-10 26Z" fill="#f97316" />
        <path d="M86 30c6-6-2-10 4-16M96 34c6-6-2-10 4-16" stroke="#6b7280" strokeWidth="3" fill="none" />
      </>}
      {k === "battery" && <>
        <rect x="34" y="30" width="52" height="70" rx="6" fill="#3b82f6" /><rect x="52" y="20" width="16" height="10" fill="#94a3b8" />
        <text x="60" y="72" textAnchor="middle" fontSize="26" fill="#fff" fontWeight="700">+ −</text>
        <path d="M70 34 58 60h12L56 92" stroke="#facc15" strokeWidth="5" fill="none" />
        <path d="M92 40c4-8-2-10 2-18 8 8 6 14 0 18Z" fill="#f97316" />
      </>}
      {k === "crt" && <>
        <rect x="18" y="26" width="84" height="68" rx="8" fill="#d6d1bd" /><rect x="28" y="36" width="64" height="46" rx="6" fill="#1f2937" />
        <path d="M60 36 54 52l10 6-8 10 6 14" stroke="#e5e7eb" strokeWidth="3" fill="none" /><rect x="40" y="94" width="40" height="8" fill="#a8a291" />
      </>}
      {k === "pcb" && <>
        <rect x="14" y="52" width="66" height="50" fill="#15803d" /><path d="M22 62h30v16h20M22 92h40M40 62v30" stroke="#eab308" strokeWidth="2.5" fill="none" />
        <rect x="52" y="82" width="14" height="14" fill="#111827" />
        <path d="M84 14l22 10-6 14-22-10Z" fill="#a3e635" stroke="#4d7c0f" strokeWidth="2" /><path d="M76 34c-6 8-2 14 2 14s8-6-2-14Z" fill="#84cc16" />
        <path d="M70 60c-4 6-1 10 2 10s5-4-2-10Z" fill="#84cc16" />
      </>}
      {k === "child" && <>
        <path d="M14 100 34 62l20 38ZM40 100 62 70l22 30Z" fill="#78716c" />
        <circle cx="94" cy="46" r="11" fill="#f5c9a0" /><path d="M82 100c0-22 4-36 12-36s12 14 12 36Z" fill="#ef4444" />
      </>}
      <circle cx="60" cy="60" r="55" fill="none" stroke="#dc2626" strokeWidth="7" /><path d="M21 21 99 99" stroke="#dc2626" strokeWidth="7" />
    </svg>
  );
}

export default function Safety({ lang }: { lang: string }) {
  const l = lang in title ? lang : "English";
  const playAll = () => say(cards.map((c) => `${c.no[l]} ${c.yes[l]}`).join(" "), l);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 12px" }}>
        <b style={{ fontSize: 22, flex: 1 }}>⚠️ {title[l]}</b>
        <span className="action" role="button" tabIndex={0} onClick={playAll} style={{ padding: "10px 16px", background: "#16a34a", color: "#fff", borderRadius: 24, fontSize: 16 }}>🔊 ▶</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.k} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", background: "#fff" }}>
            <div style={{ background: "#fef2f2", padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <Scene k={c.k} />
              <div style={{ flex: 1 }}><b style={{ color: "#dc2626", fontSize: 13 }}>✖ {dont[l]}</b><p style={{ fontSize: 16, margin: "4px 0", fontWeight: 600 }}>{c.no[l]}</p></div>
            </div>
            <div style={{ background: "#f0fdf4", padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: 44, width: 120, textAlign: "center" }}>{c.emoji}</span>
              <div style={{ flex: 1 }}><b style={{ color: "#16a34a", fontSize: 13 }}>✔ {doo[l]}</b><p style={{ fontSize: 16, margin: "4px 0" }}>{c.yes[l]}</p></div>
              <span className="action" role="button" tabIndex={0} aria-label="Play audio" onClick={() => say(`${c.no[l]} ${c.yes[l]}`, l)} style={{ fontSize: 30, cursor: "pointer" }}>🔊</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
