import { useEffect, useMemo, useState } from "react";
import { get, flush, queue, say, langName, COLLECTOR } from "./api";
import LotFlow from "./LotFlow";
import Views from "./Views";

type IconName =
  | "home"
  | "plus"
  | "chart"
  | "pin"
  | "wallet"
  | "shield"
  | "user"
  | "bell"
  | "wifi"
  | "volume"
  | "camera"
  | "sparkle"
  | "arrow"
  | "trend"
  | "battery"
  | "cable"
  | "board"
  | "phone"
  | "star"
  | "truck"
  | "check"
  | "clock"
  | "sync"
  | "close"
  | "chevron";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  wallet: <><path d="M3 6h16v13H3zM3 9h16" /><path d="M15 13h6v4h-6z" /></>,
  shield: <path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></>,
  bell: <><path d="M5 18h14l-2-3V9a5 5 0 0 0-10 0v6l-2 3Z" /><path d="M10 21h4" /></>,
  wifi: <><path d="M4 10a12 12 0 0 1 16 0M7 14a8 8 0 0 1 10 0M10 18a3 3 0 0 1 4 0" /></>,
  volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></>,
  camera: <><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="4" /></>,
  sparkle: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M16 6h5v5" /></>,
  battery: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M10 7h4M10 17h4M9 11h6v3H9z" /></>,
  cable: <><path d="M7 3v6a5 5 0 0 0 10 0V3M4 3h6M14 3h6" /><path d="M12 14v7" /></>,
  board: <><path d="M4 4h16v16H4zM8 8h8M8 12h5M8 16h3" /></>,
  phone: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 18h4" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></>,
  sync: <><path d="M20 7h-5V2M4 17h5v5" /><path d="M18 17a8 8 0 0 1-13-2M6 7a8 8 0 0 1 13 2" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
};

function Icon({ name, size = "md" }: { name: IconName; size?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <svg className={`icon icon-${size}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Action({
  children,
  className = "",
  onClick,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <div
      className={`action ${className}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && onClick) onClick();
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      {children}
    </div>
  );
}

const prices = [
  { name: "Copper cables", local: "तांबे की तार", rate: 642, unit: "kg", change: "+4.2%", icon: "cable" as IconName, tone: "amber" },
  { name: "Lithium batteries", local: "लिथियम बैटरी", rate: 118, unit: "kg", change: "+2.8%", icon: "battery" as IconName, tone: "blue" },
  { name: "Printed circuit boards", local: "सर्किट बोर्ड", rate: 386, unit: "kg", change: "+6.1%", icon: "board" as IconName, tone: "violet" },
  { name: "Mobile phones", local: "मोबाइल फोन", rate: 74, unit: "pc", change: "+1.4%", icon: "phone" as IconName, tone: "green" },
];

const recyclers = [
  { name: "GreenCycle Pune", distance: "2.4 km", rate: "₹668/kg", rating: "4.9", tag: "Best price", pickup: "Pickup today" },
  { name: "EcoMetals Recovery", distance: "4.1 km", rate: "₹651/kg", rating: "4.7", tag: "Fast payment", pickup: "Pickup tomorrow" },
  { name: "Sahyadri E-Waste", distance: "6.8 km", rate: "₹645/kg", rating: "4.8", tag: "MoEFCC verified", pickup: "Drop-off" },
];

const copy = {
  English: { greeting: "Namaste, Raju", subtitle: "Ready to turn scrap into value?", create: "Create a new lot", desc: "Take a photo. Get a fair price instantly.", board: "Today’s price board", nearby: "Top authorized recyclers" },
  हिंदी: { greeting: "नमस्ते, राजू", subtitle: "कबाड़ को सही दाम में बदलें", create: "नया लॉट बनाएं", desc: "फोटो लें। तुरंत सही दाम पाएं।", board: "आज का भाव", nearby: "नज़दीकी अधिकृत रिसाइकलर" },
  मराठी: { greeting: "नमस्कार, राजू", subtitle: "भंगाराला योग्य भाव मिळवा", create: "नवीन लॉट तयार करा", desc: "फोटो काढा. योग्य भाव लगेच मिळवा.", board: "आजचा बाजारभाव", nearby: "जवळचे अधिकृत रिसायकलर" },
};

const navItems: { label: string; icon: IconName }[] = [
  { label: "Home", icon: "home" },
  { label: "My lots", icon: "board" },
  { label: "Price board", icon: "chart" },
  { label: "Recyclers", icon: "pin" },
  { label: "Earnings", icon: "wallet" },
  { label: "Safety", icon: "shield" },
];

export default function App() {
  const [language, setLanguage] = useState<keyof typeof copy>("English");
  const [active, setActive] = useState("Home");
  const [lotOpen, setLotOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [toast, setToast] = useState("");
  const t = copy[language];
  const [live, setLive] = useState<any[] | null>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [lots, setLots] = useState<any[]>([]);
  const [top, setTop] = useState<any[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(0);
  const iconFor = (id: string): IconName => (id.includes("cable") ? "cable" : id.includes("batt") ? "battery" : id === "pcb" ? "board" : "phone");

  useEffect(() => {
    get("/prices").then((r) => { setLive(r.data); setOffline(r.offline); });
    get("/ledger?collector=" + COLLECTOR).then((r) => setLedger(r.data));
    get("/lots?collector=" + COLLECTOR).then((r) => setLots(r.data || []));
    get("/match?category_id=copper_cable&weight_kg=5").then((r) => setTop(r.data));
  }, [tick]);
  useEffect(() => { const on = () => syncNow(); window.addEventListener("online", on); return () => window.removeEventListener("online", on); }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const languageOptions = useMemo(() => Object.keys(copy) as (keyof typeof copy)[], []);

  async function speak() {
    const r = await get(`/prices/speak?lang=${encodeURIComponent(langName(language))}`);
    if (r.data) { say(r.data.text, language); setToast("Playing today’s prices aloud"); }
  }

  async function syncNow() {
    setSyncing(true);
    try { const n = await flush(); setSynced(true); setOffline(false); setTick((x) => x + 1); setToast(n ? `${n} offline item(s) synced` : "Everything is up to date"); }
    catch { setOffline(true); setToast(queue().length + " item(s) waiting for network"); }
    setSyncing(false);
  }

  function cycleLanguage() {
    const current = languageOptions.indexOf(language);
    setLanguage(languageOptions[(current + 1) % languageOptions.length]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="sync" size="md" /></div>
          <div>
            <p className="brand-name">Kabadi<span>Connect</span></p>
            <p className="brand-tag">Fair value. Clean future.</p>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Action key={item.label} className={`nav-item ${active === item.label ? "is-active" : ""}`} onClick={() => setActive(item.label)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "My lots" && <span className="nav-count">{lots.length}</span>}
            </Action>
          ))}
        </nav>

        <div className="side-help">
          <div className="help-icon"><Icon name="volume" /></div>
          <p className="help-title">Need help?</p>
          <p className="help-copy">Hear every screen in your language.</p>
          <Action className="help-action" onClick={() => setActive("Safety")}>Start voice guide <Icon name="arrow" size="sm" /></Action>
        </div>

        <div className="profile">
          <div className="avatar">RK</div>
          <div>
            <p className="profile-name">Raju Kadam</p>
            <p className="profile-meta">Collector · Pune</p>
          </div>
          <Icon name="chevron" size="sm" />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Collector dashboard</p>
            <p className="page-title">{t.greeting}</p>
          </div>
          <div className="top-actions">
            <Action className="status-pill" onClick={syncNow}>
              <span className={`status-dot ${syncing ? "pulse" : ""}`} />
              <Icon name={syncing ? "sync" : "wifi"} size="sm" />
              <span>{syncing ? "Syncing…" : offline ? "Offline" + (queue().length ? ` · ${queue().length} queued` : "") : "Online · synced"}</span>
            </Action>
            <Action className="language" onClick={cycleLanguage} label="Change language">
              <span className="language-glyph">अ</span>
              <span>{language}</span>
              <Icon name="chevron" size="sm" />
            </Action>
            <Action className="icon-action" onClick={() => setToast("No new notifications")} label="Notifications">
              <Icon name="bell" />
              <span className="notification-dot" />
            </Action>
          </div>
        </header>

        <div className="content">
          {active === "Home" ? (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="hero-kicker"><Icon name="sparkle" size="sm" /> AI-assisted fair valuation</div>
                  <p className="hero-title">{t.subtitle}</p>
                  <p className="hero-text">Photograph your e-waste, compare verified offers, and get paid with a traceable handover.</p>
                  <div className="hero-actions">
                    <Action className="primary-action" onClick={() => setLotOpen(true)}>
                      <span className="action-icon"><Icon name="camera" /></span>
                      <span><strong>{t.create}</strong><small>{t.desc}</small></span>
                      <Icon name="arrow" />
                    </Action>
                    <Action className="speak-action" onClick={speak}>
                      <Icon name="volume" /><span>Listen</span>
                    </Action>
                  </div>
                </div>
                <div className="hero-visual" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="scan-card">
                    <div className="scan-top"><span>AI MATERIAL SCAN</span><span className="live-dot">LIVE</span></div>
                    <div className="scrap-illustration">
                      <div className="cable-loop" />
                      <div className="board-shape"><span /><span /><span /><span /></div>
                      <div className="battery-shape" />
                      <div className="scan-line" />
                    </div>
                    <div className="scan-result">
                      <span className="result-check"><Icon name="check" size="sm" /></span>
                      <span><small>Identified</small><strong>Copper cable · Grade A</strong></span>
                      <strong className="confidence">96%</strong>
                    </div>
                  </div>
                  <div className="float-chip chip-price"><Icon name="trend" size="sm" /><span><small>Fair value</small><strong>₹3,210</strong></span></div>
                  <div className="float-chip chip-match"><Icon name="check" size="sm" /><span><small>Verified buyers</small><strong>12 nearby</strong></span></div>
                </div>
              </section>

              <section className="metrics">
                <div className="metric">
                  <span className="metric-icon green"><Icon name="wallet" /></span>
                  <span><small>Total earnings</small><strong>₹{ledger?.total_earned ?? 0}</strong><em><Icon name="trend" size="sm" /> paid</em></span>
                </div>
                <div className="metric">
                  <span className="metric-icon amber"><Icon name="clock" /></span>
                  <span><small>Pending payment</small><strong>₹{ledger?.pending ?? 0}</strong><em className="neutral">awaiting recycler</em></span>
                </div>
                <div className="metric">
                  <span className="metric-icon blue"><Icon name="board" /></span>
                  <span><small>Material recycled</small><strong>{ledger?.kg_recycled ?? 0} kg</strong><em><Icon name="trend" size="sm" /> recycled</em></span>
                </div>
                <div className="metric">
                  <span className="metric-icon violet"><Icon name="shield" /></span>
                  <span><small>Formal handovers</small><strong>{ledger?.handovers ?? 0}</strong><em className="verified"><Icon name="check" size="sm" /> All verified</em></span>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel prices-panel">
                  <div className="panel-heading">
                    <div><p className="section-title">{t.board}</p><p className="section-subtitle">Pune · {offline ? "cached (offline)" : "live"}</p></div>
                    <div className="panel-tools">
                      <Action className="mini-listen" onClick={speak}><Icon name="volume" size="sm" /> Hear prices</Action>
                      <Action className="text-action" onClick={() => setActive("Price board")}>View all <Icon name="arrow" size="sm" /></Action>
                    </div>
                  </div>
                  <div className="price-list">
                    {(live || []).slice(0, 5).map((item: any) => (
                      <div className="price-row" key={item.id}>
                        <span className="material-icon amber"><Icon name={iconFor(item.id)} /></span>
                        <span className="material-name"><strong>{item.name}</strong><small>{language === "मराठी" ? item.local_mr : item.local_hi}</small></span>
                        <span className="sparkline" aria-label="price rising"><i /><i /><i /><i /><i /><i /></span>
                        <span className="rate"><strong>₹{item.rate}</strong><small>per {item.unit}</small></span>
                        <span className="change"><Icon name="trend" size="sm" /> {item.change_pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="price-note"><Icon name="shield" size="sm" /> Prices are based on verified recycler offers and recent local transactions.</div>
                </div>

                <div className="panel activity-panel">
                  <div className="panel-heading">
                    <div><p className="section-title">Recent activity</p><p className="section-subtitle">Your latest lots</p></div>
                    <Action className="text-action" onClick={() => setActive("My lots")}>View all <Icon name="arrow" size="sm" /></Action>
                  </div>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-line complete"><span><Icon name="check" size="sm" /></span></div>
                      <div className="activity-info"><strong>Copper cables · 5 kg</strong><small>GreenCycle Pune · Today, 10:42</small><span className="activity-status">Handover complete</span></div>
                      <strong className="activity-value">₹3,210</strong>
                    </div>
                    <div className="activity-item">
                      <div className="activity-line pending"><span><Icon name="truck" size="sm" /></span></div>
                      <div className="activity-info"><strong>Mixed electronics · 12 kg</strong><small>EcoMetals Recovery · Yesterday</small><span className="activity-status pending-text">Pickup on the way</span></div>
                      <strong className="activity-value">₹2,450</strong>
                    </div>
                    <div className="activity-item">
                      <div className="activity-line draft"><span><Icon name="clock" size="sm" /></span></div>
                      <div className="activity-info"><strong>Lithium batteries · 8 kg</strong><small>Saved offline · 2 days ago</small><span className="activity-status draft-text">Draft · needs sync</span></div>
                      <strong className="activity-value">~₹944</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel recycler-panel">
                <div className="panel-heading">
                  <div><p className="section-title">{t.nearby}</p><p className="section-subtitle">Matched for copper cables · sorted by value and distance</p></div>
                  <Action className="text-action" onClick={() => setActive("Recyclers")}>Open map <Icon name="pin" size="sm" /></Action>
                </div>
                <div className="recycler-grid">
                  {(top || []).slice(0, 3).map((r: any, index: number) => { const recycler = { name: r.name, rating: r.rating, distance: r.distance_km + " km", rate: "₹" + r.rate + "/kg", pickup: r.pickup ? "Pickup available" : "Drop-off" }; return (
                    <div className={`recycler-card ${index === 0 ? "recommended" : ""}`} key={recycler.name}>
                      {index === 0 && <span className="recommended-tag"><Icon name="sparkle" size="sm" /> Best match</span>}
                      <div className="recycler-top">
                        <div className="recycler-logo">{recycler.name.split(" ").map((part: string) => part[0]).join("").slice(0, 2)}</div>
                        <div className="recycler-name"><strong>{recycler.name}</strong><span><Icon name="shield" size="sm" /> Authorized facility</span></div>
                        <span className="rating"><Icon name="star" size="sm" /> {recycler.rating}</span>
                      </div>
                      <div className="recycler-data">
                        <span><small>Distance</small><strong>{recycler.distance}</strong></span>
                        <span><small>Offered rate</small><strong className="green-text">{recycler.rate}</strong></span>
                      </div>
                      <div className="recycler-footer"><span><Icon name="truck" size="sm" /> {recycler.pickup}</span><Action onClick={() => setToast(`Offer opened from ${recycler.name}`)}>View offer <Icon name="chevron" size="sm" /></Action></div>
                    </div>
                  ); })}
                </div>
              </section>
            </>
                    ) : (
            <Views key={active + tick} view={active} lang={language} />
          )}
        </div>

        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.slice(0, 5).map((item, index) => (
            <Action key={item.label} className={`mobile-nav-item ${active === item.label ? "is-active" : ""} ${index === 2 ? "mobile-create" : ""}`} onClick={() => index === 2 ? setLotOpen(true) : setActive(item.label)}>
              <span><Icon name={index === 2 ? "plus" : item.icon} /></span>
              <small>{index === 2 ? "New lot" : item.label}</small>
            </Action>
          ))}
        </nav>
      </main>

      {lotOpen && <LotFlow lang={language} onClose={() => { setLotOpen(false); setTick((x) => x + 1); }} onDone={setToast} />}

      {toast && <div className="toast"><Icon name="check" size="sm" /> {toast}</div>}
    </div>
  );
}
