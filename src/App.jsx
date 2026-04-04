import { useState, useEffect, useRef } from "react";

const API_BASE = "https://brawl-stats-backend.onrender.com/api";


// Brawl Stars seasons start ~every 2 months from Jan 2023
function getCurrentSeason() {
  const start = new Date("2023-01-01");
  const now = new Date();
  const weeks = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  const season = Math.floor(weeks / 8) + 1;
  const weekInSeason = (weeks % 8) + 1;
  return { season, weekInSeason, totalWeeks: 8 };
}

const THEMES = {
  nova: {
    name: "Nova",
    bg: "#0a0b14",
    bgCard: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.07)",
    accent: "#7c6aff",
    accentAlt: "#ff6acd",
    text: "#f0eeff",
    textSub: "#7b7a9a",
    textMuted: "#2a2a4a",
    navBg: "rgba(8,8,18,0.97)",
    headerBg: "rgba(8,8,18,0.92)",
    gradientTop: "radial-gradient(ellipse 80% 35% at 50% -5%, rgba(124,106,255,0.12) 0%, transparent 65%)",
    btnBg: "#7c6aff",
    btnText: "#fff",
  },
  ember: {
    name: "Ember",
    bg: "#0f0a00",
    bgCard: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.07)",
    accent: "#ff8c00",
    accentAlt: "#ff4444",
    text: "#fff5e6",
    textSub: "#8a7060",
    textMuted: "#2a1a0a",
    navBg: "rgba(12,8,0,0.97)",
    headerBg: "rgba(12,8,0,0.92)",
    gradientTop: "radial-gradient(ellipse 80% 35% at 50% -5%, rgba(255,140,0,0.1) 0%, transparent 65%)",
    btnBg: "#ff8c00",
    btnText: "#0f0a00",
  },
};

const rarityColors = {
  "Common": "#90a4ae",
  "Rare": "#4caf75",
  "Super Rare": "#29b6f6",
  "Epic": "#9c6fde",
  "Mythic": "#e85555",
  "Legendary": "#f5a623",
};

const rarityGlow = {
  "Common": "0 0 8px rgba(144,164,174,0.3)",
  "Rare": "0 0 10px rgba(76,175,117,0.35)",
  "Super Rare": "0 0 10px rgba(41,182,246,0.35)",
  "Epic": "0 0 12px rgba(156,111,222,0.4)",
  "Mythic": "0 0 12px rgba(232,85,85,0.4)",
  "Legendary": "0 0 20px rgba(245,166,35,0.5), 0 0 40px rgba(245,166,35,0.15)",
};

// Brawlify CDN — image par nom de brawler
function getBrawlerImage(name) {
  if (!name) return null;
  const clean = name.trim().replace(/\s+/g, "_");
  return `https://cdn.brawlify.com/brawler/borderless/${clean}.png`;
}

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================
//  TROPHY CHART — courbe par semaine / saison
// ============================================================
function generateEstimatedHistory(currentTrophies, highestTrophies, mode = "week") {
  const points = mode === "week" ? 8 : 14;
  const data = [];
  const peak = highestTrophies || currentTrophies;
  const base = Math.max(0, peak * 0.55);
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const trend = base + (peak - base) * Math.pow(t, 0.55);
    const wave = Math.sin(t * Math.PI * 2.2) * (peak - base) * 0.14;
    const noise = (Math.random() - 0.48) * (peak - base) * 0.07;
    data.push(Math.round(Math.max(base, Math.min(peak, trend + wave + noise))));
  }
  data[Math.round(points * 0.7)] = peak;
  data[points - 1] = currentTrophies;
  return data;
}

function TrophyChart({ trophies, highestTrophies, realHistory, accent, mode = "week" }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const season = getCurrentSeason();

  const rawData = realHistory && realHistory.length >= 2
    ? realHistory.map(r => parseInt(r.trophies))
    : generateEstimatedHistory(trophies, highestTrophies, mode);

  const dataRef = useRef(rawData);
  const isReal = realHistory && realHistory.length >= 2;

  useEffect(() => {
    dataRef.current = rawData;
    setProgress(0);
    let start = null;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, ease((ts - start) / 1400));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [trophies, highestTrophies, realHistory]);

  const data = dataRef.current;
  const W = 540, H = 155;
  const PAD = { top: 22, right: 20, bottom: 32, left: 50 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const minV = Math.min(...data) * 0.9;
  const maxV = Math.max(...data) * 1.05;
  const toX = i => PAD.left + (i / (data.length - 1)) * iW;
  const toY = v => PAD.top + iH - ((v - minV) / (maxV - minV)) * iH;
  const visible = Math.max(2, Math.round(progress * (data.length - 1)) + 1);
  const vd = data.slice(0, visible);

  const pathD = vd.map((v, i) => {
    if (i === 0) return `M${toX(0)},${toY(v)}`;
    const px = toX(i - 1), py = toY(vd[i - 1]);
    const cx = toX(i), cy = toY(v);
    const cpx = (px + cx) / 2;
    return `C${cpx},${py} ${cpx},${cy} ${cx},${cy}`;
  }).join(" ");
  const areaD = pathD + ` L${toX(visible - 1)},${PAD.top + iH} L${toX(0)},${PAD.top + iH} Z`;
  const yTicks = [minV, (minV + maxV) / 2, maxV];

  // Labels semaine
  const weekLabels = Array.from({ length: data.length }, (_, i) => {
    const w = season.weekInSeason - (data.length - 1 - i);
    if (w <= 0) return `S${season.season - 1}`;
    return `S${season.season} W${w}`;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,4" />
            <text x={PAD.left - 7} y={toY(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Sans,sans-serif">
              {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
            </text>
          </g>
        ))}
        {data.map((_, i) => {
          if (i % 2 !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8.5" fontFamily="DM Sans,sans-serif">
              {weekLabels[i]}
            </text>
          );
        })}
        {vd.length > 1 && <path d={areaD} fill="url(#chartArea)" />}
        {vd.length > 1 && <path d={pathD} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />}
        {(() => {
          const peakVal = Math.max(...vd);
          const peakI = vd.indexOf(peakVal);
          if (peakI < 0 || peakI === vd.length - 1) return null;
          return (
            <g>
              <circle cx={toX(peakI)} cy={toY(peakVal)} r={4} fill={accent} stroke="#0a0b14" strokeWidth="2" />
              <text x={toX(peakI)} y={toY(peakVal) - 9} textAnchor="middle" fill={accent} fontSize="9" fontWeight="700" fontFamily="DM Sans,sans-serif">
                ^ {peakVal.toLocaleString()}
              </text>
            </g>
          );
        })()}
        {vd.length > 1 && (() => {
          const last = vd[vd.length - 1];
          const x = toX(vd.length - 1), y = toY(last);
          return (
            <g>
              <circle cx={x} cy={y} r={5} fill={accent} stroke="#0a0b14" strokeWidth="2.5" />
              <circle cx={x} cy={y} r={9} fill={accent} fillOpacity="0.12" />
            </g>
          );
        })()}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: isReal ? "#4caf75" : "rgba(255,255,255,0.2)" }} />
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68em", fontFamily: "DM Sans,sans-serif" }}>
          {isReal
            ? `Donnees reelles (${realHistory.length} points) - Saison ${season.season}, Semaine ${season.weekInSeason}/${season.totalWeeks}`
            : `Courbe estimee - Saison ${season.season}, Semaine ${season.weekInSeason}/${season.totalWeeks}`
          }
        </span>
      </div>
    </div>
  );
}

// ============================================================
//  UI COMPONENTS
// ============================================================
function LoadingSpinner({ accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 44 }}>
      <div style={{ width: 36, height: 36, border: `2.5px solid ${accent}22`, borderTop: `2.5px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72em", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif" }}>Chargement</span>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}22`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, minWidth: 78 }}>
      <span style={{ color, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.05em", letterSpacing: "-0.03em" }}>
        {typeof value === "number" ? value.toLocaleString() : value ?? "--"}
      </span>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62em", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "DM Sans,sans-serif" }}>{label}</span>
    </div>
  );
}

function BrawlerCard({ brawler, theme }) {
  const rarity = brawler.rarity?.name || "Common";
  const color = rarityColors[rarity] || "#aaa";
  const [imgError, setImgError] = useState(false);
  const imgUrl = getBrawlerImage(brawler.name);

  return (
    <div
      style={{ background: theme.bgCard, border: `1px solid ${color}28`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "default", transition: "transform 0.16s, box-shadow 0.16s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = rarityGlow[rarity]; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {!imgError && imgUrl ? (
        <img
          src={imgUrl}
          alt={brawler.name}
          style={{ width: 54, height: 54, objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{ width: 54, height: 54, background: `${color}18`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color, fontFamily: "Outfit,sans-serif", fontWeight: 800 }}>
          {brawler.name?.charAt(0)}
        </div>
      )}
      <span style={{ color: theme.text, fontFamily: "Outfit,sans-serif", fontWeight: 600, fontSize: "0.78em", textAlign: "center" }}>{brawler.name}</span>
      <span style={{ color, fontSize: "0.6em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "DM Sans,sans-serif" }}>{rarity}</span>
    </div>
  );
}

function PlayerBrawlerRow({ b, accent }) {
  const maxT = b.highestTrophies || b.trophies;
  const pct = maxT > 0 ? Math.min(100, (b.trophies / maxT) * 100) : 0;
  const [imgError, setImgError] = useState(false);

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "9px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {!imgError ? (
          <img src={getBrawlerImage(b.name)} alt={b.name} style={{ width: 32, height: 32, objectFit: "contain" }} onError={() => setImgError(true)} />
        ) : (
          <div style={{ width: 32, height: 32, background: `${accent}12`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: "0.75em", fontWeight: 800, fontFamily: "Outfit,sans-serif" }}>{b.rank ?? "?"}</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Outfit,sans-serif", fontWeight: 600, fontSize: "0.83em" }}>{b.name}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif" }}>{b.trophies.toLocaleString()} / {maxT.toLocaleString()}</div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif" }}>Lvl {b.power}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${accent}, ${accent}88)`, borderRadius: 4, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function RankingRow({ player, index, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: index < 3 ? `${accent}0a` : "rgba(255,255,255,0.02)", borderRadius: 10, border: index < 3 ? `1px solid ${accent}18` : "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ minWidth: 28, textAlign: "center", fontFamily: "Outfit,sans-serif", fontWeight: 800, color: index < 3 ? [accent, "rgba(255,255,255,0.5)", "rgba(205,127,50,0.8)"][index] : "rgba(255,255,255,0.2)", fontSize: index < 3 ? "1em" : "0.82em" }}>
        #{index + 1}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.87em", fontFamily: "Outfit,sans-serif", fontWeight: 600 }}>{player.name}</div>
        {player.club?.name && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif" }}>{player.club.name}</div>}
      </div>
      <span style={{ color: accent, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.88em" }}>{player.trophies?.toLocaleString()}</span>
    </div>
  );
}

function ThemeSwitcher({ currentTheme, onSwitch }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Object.entries(THEMES).map(([key, t]) => (
        <button key={key} onClick={() => onSwitch(key)} style={{ width: 26, height: 26, borderRadius: "50%", border: currentTheme === key ? `2px solid ${t.accent}` : "2px solid rgba(255,255,255,0.1)", background: `linear-gradient(135deg, ${t.accent}, ${t.accentAlt})`, cursor: "pointer", transition: "transform 0.15s", transform: currentTheme === key ? "scale(1.2)" : "scale(1)" }} title={t.name} />
      ))}
    </div>
  );
}

// ============================================================
//  BATTLE LOG
// ============================================================
function BattleLog({ tag, theme }) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = theme;

  useEffect(() => {
    apiFetch(`/players/${tag}/battlelog`)
      .then(d => setBattles(d.items || []))
      .catch(() => setBattles([]))
      .finally(() => setLoading(false));
  }, [tag]);

  const resultColor = (result) => {
    if (result === "victory") return "#4caf75";
    if (result === "defeat") return "#e85555";
    return "rgba(255,255,255,0.4)";
  };

  const modeColors = { gemGrab: "#9c6fde", brawlBall: "#29b6f6", heist: "#e85555", bounty: "#4caf75", siege: "#ff8c00", hotZone: "#ff6b35", knockout: "#e91e63", showdown: "#f5a623", duels: "#f5a623" };

  if (loading) return <LoadingSpinner accent={t.accent} />;
  if (!battles.length) return (
    <div style={{ background: t.bgCard, borderRadius: 12, padding: 30, textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans,sans-serif", fontSize: "0.85em" }}>
      Aucune bataille disponible
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {battles.slice(0, 20).map((b, i) => {
        const mode = b.battle?.mode || b.event?.mode || "unknown";
        const color = modeColors[mode] || t.accent;
        const result = b.battle?.result;
        const trophyChange = b.battle?.trophyChange;
        const myBrawler = b.battle?.teams?.flat().find(p => p.tag === `#${tag}`)?.brawler
          || b.battle?.players?.find(p => p.tag === `#${tag}`)?.brawler;

        return (
          <div key={i} style={{ background: t.bgCard, border: `1px solid ${color}22`, borderRadius: 11, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            {myBrawler && (
              <img
                src={getBrawlerImage(myBrawler.name)}
                alt={myBrawler.name}
                style={{ width: 36, height: 36, objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ color, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.82em", textTransform: "capitalize" }}>
                {mode.replace(/([A-Z])/g, " $1").trim()}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif", marginTop: 2 }}>
                {b.event?.map || "Map inconnue"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {result && (
                <div style={{ color: resultColor(result), fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.8em", textTransform: "capitalize" }}>{result}</div>
              )}
              {trophyChange !== undefined && (
                <div style={{ color: trophyChange >= 0 ? "#4caf75" : "#e85555", fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "0.85em" }}>
                  {trophyChange >= 0 ? "+" : ""}{trophyChange}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  PLAYER SEARCH PAGE
// ============================================================
function PlayerSearchPage({ theme, savedTag, onTagSaved }) {
  const [tag, setTag] = useState(savedTag || "");
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [history, setHistory] = useState(null);
  const t = theme;

  useEffect(() => {
    if (savedTag) doSearch(savedTag);
  }, []);

  const doSearch = async (searchTag) => {
    const clean = (searchTag || tag).trim().replace(/^#/, "").toUpperCase();
    if (!clean) return;
    setLoading(true); setError(null); setPlayer(null); setHistory(null); setTab("overview");
    try {
      const data = await apiFetch(`/players/%23${clean}`);
      setPlayer(data);
      onTagSaved(clean);
      fetch(`${API_BASE}/players/${clean}/track`, { method: "POST" }).catch(() => {});
      // Charger historique en parallele
      fetch(`${API_BASE}/players/${clean}/history?days=56&groupBy=week`)
        .then(r => r.json())
        .then(d => setHistory(d.history || null))
        .catch(() => {});
    } catch {
      setError("Joueur introuvable. Verifie le tag (#ABC123...)");
      onTagSaved(null);
    }
    setLoading(false);
  };

  const logout = () => {
    setPlayer(null); setTag(""); onTagSaved(null); setError(null); setHistory(null);
  };

  const tabs = [
    { id: "overview", label: "Apercu" },
    { id: "chart", label: "Courbe" },
    { id: "brawlers", label: "Brawlers" },
    { id: "battles", label: "Batailles" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {!player && (
        <>
          <div>
            <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Joueur</h2>
            <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>Entre ton tag pour acceder a ton profil</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="#TAG123..."
              style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: t.text, fontSize: "0.92em", fontFamily: "DM Sans,sans-serif", outline: "none", letterSpacing: "0.03em" }}
              onFocus={e => e.target.style.borderColor = `${t.accent}88`}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            <button onClick={() => doSearch()} style={{ background: t.btnBg, border: "none", borderRadius: 10, padding: "11px 20px", color: t.btnText, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.88em", cursor: "pointer", boxShadow: `0 4px 18px ${t.accent}30` }}>
              Chercher
            </button>
          </div>
        </>
      )}

      {loading && <LoadingSpinner accent={t.accent} />}
      {error && <div style={{ background: "rgba(232,85,85,0.08)", border: "1px solid rgba(232,85,85,0.25)", borderRadius: 10, padding: 14, color: "#e85555", fontSize: "0.83em", fontFamily: "DM Sans,sans-serif" }}>{error}</div>}

      {player && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
          {/* Header */}
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 50, height: 50, background: `linear-gradient(135deg, ${t.accent}30, ${t.accentAlt}20)`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.1em", color: t.accent }}>
                {player.expLevel}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.text, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.1em", letterSpacing: "-0.025em" }}>{player.name}</div>
                <div style={{ color: t.textSub, fontSize: "0.73em", fontFamily: "DM Sans,sans-serif", marginTop: 1 }}>{player.tag}</div>
                {player.club?.name && <div style={{ color: t.accent, fontSize: "0.76em", fontFamily: "DM Sans,sans-serif", marginTop: 3 }}>{player.club.name}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ color: t.accent, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.3em", letterSpacing: "-0.04em" }}>{player.trophies?.toLocaleString()}</div>
                <div style={{ color: t.textSub, fontSize: "0.65em", fontFamily: "DM Sans,sans-serif" }}>Record: {player.highestTrophies?.toLocaleString()}</div>
                <button onClick={logout} style={{ background: "rgba(232,85,85,0.1)", border: "1px solid rgba(232,85,85,0.2)", borderRadius: 7, padding: "3px 10px", color: "#e85555", fontSize: "0.68em", fontFamily: "DM Sans,sans-serif", cursor: "pointer", fontWeight: 600 }}>
                  Deconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 7 }}>
            <StatBadge label="3v3" value={player["3vs3Victories"]} color="#29b6f6" />
            <StatBadge label="Solo" value={player.soloVictories} color="#4caf75" />
            <StatBadge label="Duo" value={player.duoVictories} color="#9c6fde" />
            <StatBadge label="Brawlers" value={player.brawlers?.length} color={t.accent} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ flex: 1, background: tab === tb.id ? t.btnBg : "transparent", border: "none", borderRadius: 8, padding: "7px 6px", color: tab === tb.id ? t.btnText : t.textSub, fontFamily: "Outfit,sans-serif", fontWeight: tab === tb.id ? 700 : 500, fontSize: "0.72em", cursor: "pointer", transition: "all 0.18s" }}>
                {tb.label}
              </button>
            ))}
          </div>

          {/* Apercu */}
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Niveau EXP", val: player.expLevel, sub: `${player.expPoints?.toLocaleString()} pts`, c: t.accent },
                  { label: "Brawlers", val: player.brawlers?.length, sub: "debloques", c: "#29b6f6" },
                ].map(s => (
                  <div key={s.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 5 }}>{s.label}</div>
                    <div style={{ color: s.c, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{s.val}</div>
                    <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif", marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 10 }}>Top Brawlers</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {player.brawlers?.sort((a, b) => b.trophies - a.trophies).slice(0, 5).map((b, i) => {
                    const [imgErr, setImgErr] = useState(false);
                    return (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {!imgErr ? (
                          <img src={getBrawlerImage(b.name)} alt={b.name} style={{ width: 28, height: 28, objectFit: "contain" }} onError={() => setImgErr(true)} />
                        ) : (
                          <div style={{ width: 28, height: 28, background: `${t.accent}15`, borderRadius: 6 }} />
                        )}
                        <span style={{ color: i < 3 ? [t.accent, "rgba(255,255,255,0.5)", "rgba(205,127,50,0.8)"][i] : "rgba(255,255,255,0.2)", fontSize: "0.78em", minWidth: 18, fontFamily: "Outfit,sans-serif", fontWeight: 800 }}>#{i + 1}</span>
                        <span style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: "0.84em", fontFamily: "DM Sans,sans-serif" }}>{b.name}</span>
                        <span style={{ color: t.accent, fontSize: "0.8em", fontFamily: "Outfit,sans-serif", fontWeight: 700 }}>{b.trophies.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Courbe */}
          {tab === "chart" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 4 }}>Trophees actuels</div>
                    <div style={{ color: t.accent, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{player.trophies?.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 4 }}>Record</div>
                    <div style={{ color: "#29b6f6", fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{player.highestTrophies?.toLocaleString()}</div>
                  </div>
                </div>
                <TrophyChart
                  trophies={player.trophies}
                  highestTrophies={player.highestTrophies}
                  realHistory={history}
                  accent={t.accent}
                  mode="week"
                />
              </div>
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 12 }}>Top 5 - Progression</div>
                {player.brawlers?.sort((a, b) => b.trophies - a.trophies).slice(0, 5).map(b => {
                  const max = b.highestTrophies || b.trophies;
                  const pct = max > 0 ? (b.trophies / max) * 100 : 0;
                  return (
                    <div key={b.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "rgba(255,255,255,0.65)", fontFamily: "DM Sans,sans-serif", fontSize: "0.82em" }}>{b.name}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: t.accent, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.8em" }}>{b.trophies.toLocaleString()}</span>
                          <span style={{ color: t.textSub, fontSize: "0.7em" }}>/ {max.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 5 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${t.accent}, ${t.accentAlt})`, borderRadius: 4, transition: "width 1.1s cubic-bezier(.4,0,.2,1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brawlers */}
          {tab === "brawlers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {player.brawlers?.sort((a, b) => b.trophies - a.trophies).map(b => (
                <PlayerBrawlerRow key={b.id} b={b} accent={t.accent} />
              ))}
            </div>
          )}

          {/* Batailles */}
          {tab === "battles" && (
            <BattleLog tag={player.tag.replace(/^#/, "")} theme={t} />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  BRAWLERS PAGE
// ============================================================
function BrawlersPage({ theme }) {
  const [brawlers, setBrawlers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const t = theme;

  useEffect(() => {
    setLoading(true);
    apiFetch("/brawlers?limit=100").then(d => setBrawlers(d.items || [])).catch(() => setBrawlers([])).finally(() => setLoading(false));
  }, []);

  const rarities = ["All", ...Object.keys(rarityColors)];
  const filtered = brawlers.filter(b =>
    (filter === "All" || b.rarity?.name === filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Brawlers</h2>
        <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>{brawlers.length} brawlers</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
        style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: t.text, fontSize: "0.88em", outline: "none", fontFamily: "DM Sans,sans-serif" }}
        onFocus={e => e.target.style.borderColor = `${t.accent}88`}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
      />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {rarities.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{ background: filter === r ? (rarityColors[r] || t.accent) : "rgba(255,255,255,0.04)", border: `1px solid ${rarityColors[r] ? rarityColors[r] + "33" : "rgba(255,255,255,0.07)"}`, borderRadius: 7, padding: "4px 11px", color: filter === r ? "#111" : t.textSub, fontSize: "0.7em", fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans,sans-serif", letterSpacing: "0.05em", transition: "all 0.15s" }}>{r}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner accent={t.accent} /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
          {filtered.map(b => <BrawlerCard key={b.id} brawler={b} theme={t} />)}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  RANKINGS PAGE
// ============================================================
function RankingsPage({ theme }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("global");
  const t = theme;
  const countries = [
    { code: "global", label: "Global" },
    { code: "FR", label: "France" },
    { code: "US", label: "USA" },
    { code: "JP", label: "Japon" },
    { code: "BR", label: "Bresil" },
    { code: "DE", label: "Allemagne" },
  ];

  useEffect(() => {
    setLoading(true);
    const ep = country === "global" ? "/rankings/global/players?limit=25" : `/rankings/${country}/players?limit=25`;
    apiFetch(ep).then(d => setRankings(d.items || [])).catch(() => setRankings([])).finally(() => setLoading(false));
  }, [country]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Classements</h2>
        <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>Top 25 joueurs</p>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {countries.map(c => (
          <button key={c.code} onClick={() => setCountry(c.code)} style={{ background: country === c.code ? t.btnBg : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 11px", color: country === c.code ? t.btnText : t.textSub, fontSize: "0.77em", fontWeight: country === c.code ? 700 : 500, cursor: "pointer", fontFamily: "DM Sans,sans-serif", transition: "all 0.15s" }}>{c.label}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner accent={t.accent} /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {rankings.length === 0
            ? <div style={{ color: t.textSub, textAlign: "center", padding: 30, fontFamily: "DM Sans,sans-serif", fontSize: "0.85em" }}>Aucun classement disponible</div>
            : rankings.map((p, i) => <RankingRow key={p.tag} player={p} index={i} accent={t.accent} />)}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  CLUBS PAGE
// ============================================================
function ClubSearchPage({ theme }) {
  const [tag, setTag] = useState("");
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const t = theme;

  const search = async () => {
    const clean = tag.trim().replace(/^#/, "").toUpperCase();
    if (!clean) return;
    setLoading(true); setError(null); setClub(null);
    try { setClub(await apiFetch(`/clubs/%23${clean}`)); }
    catch { setError("Club introuvable."); }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Clubs</h2>
        <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>Recherche par tag</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="#CLUBTAG..."
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "11px 14px", color: t.text, fontSize: "0.92em", fontFamily: "DM Sans,sans-serif", outline: "none" }}
          onFocus={e => e.target.style.borderColor = `${t.accent}88`}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <button onClick={search} style={{ background: t.btnBg, border: "none", borderRadius: 10, padding: "11px 20px", color: t.btnText, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.88em", cursor: "pointer" }}>Chercher</button>
      </div>
      {loading && <LoadingSpinner accent={t.accent} />}
      {error && <div style={{ background: "rgba(232,85,85,0.08)", border: "1px solid rgba(232,85,85,0.2)", borderRadius: 10, padding: 14, color: "#e85555", fontSize: "0.83em", fontFamily: "DM Sans,sans-serif" }}>{error}</div>}
      {club && (
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, background: `${t.accent}12`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: t.accent, fontFamily: "Outfit,sans-serif", fontWeight: 800 }}>C</div>
            <div>
              <div style={{ color: t.accent, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1em" }}>{club.name}</div>
              <div style={{ color: t.textSub, fontSize: "0.78em", fontFamily: "DM Sans,sans-serif", marginTop: 2 }}>{club.description || "Aucune description"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatBadge label="Membres" value={club.members?.length} color="#29b6f6" />
            <StatBadge label="Trophees" value={club.trophies} color={t.accent} />
            <StatBadge label="Requis" value={club.requiredTrophies} color="#ff6b35" />
          </div>
          {club.members?.slice(0, 8).map((m, i) => (
            <div key={m.tag} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: 7 }}>
              <span style={{ color: t.textSub, fontSize: "0.73em", minWidth: 20, fontFamily: "Outfit,sans-serif", fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ flex: 1, color: "rgba(255,255,255,0.7)", fontSize: "0.82em", fontFamily: "DM Sans,sans-serif" }}>{m.name}</span>
              <span style={{ color: t.accent, fontSize: "0.77em", fontFamily: "Outfit,sans-serif", fontWeight: 700 }}>{m.trophies?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  EVENTS PAGE
// ============================================================
function EventsPage({ theme }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const t = theme;
  const modeColors = { gemGrab: "#9c6fde", brawlBall: "#29b6f6", heist: "#e85555", bounty: "#4caf75", siege: "#ff8c00", hotZone: "#ff6b35", knockout: "#e91e63", wipeout: "#f44336", duels: "#f5a623", showdown: "#f5a623" };

  useEffect(() => {
    setLoading(true);
    apiFetch("/events/rotation").then(d => setEvents(d.items || d || [])).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Evenements</h2>
        <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>Rotation actuelle</p>
      </div>
      {loading ? <LoadingSpinner accent={t.accent} /> : events.length === 0 ? (
        <div style={{ background: t.bgCard, borderRadius: 14, padding: 36, textAlign: "center", color: t.textSub, fontFamily: "DM Sans,sans-serif", fontSize: "0.85em" }}>Aucun evenement disponible</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
          {events.map((ev, i) => {
            const mode = ev.event?.mode || "unknown";
            const color = modeColors[mode] || t.accent;
            return (
              <div key={i} style={{ background: `${color}0e`, border: `1px solid ${color}28`, borderRadius: 12, padding: 14 }}>
                <div style={{ color, fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.85em", textTransform: "capitalize" }}>{mode.replace(/([A-Z])/g, " $1").trim()}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82em", fontFamily: "DM Sans,sans-serif", marginTop: 4 }}>{ev.event?.map}</div>
                {ev.slotId && <div style={{ color: t.textSub, fontSize: "0.68em", fontFamily: "DM Sans,sans-serif", marginTop: 2 }}>Slot #{ev.slotId}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  APP ROOT
// ============================================================
export default function BrawlStarsApp() {
  const [page, setPage] = useState("search");
  const [themeKey, setThemeKey] = useState(() => { try { return localStorage.getItem("bs_theme") || "nova"; } catch { return "nova"; } });
  const [savedTag, setSavedTag] = useState(() => { try { return localStorage.getItem("bs_tag") || null; } catch { return null; } });
  const theme = THEMES[themeKey] || THEMES.nova;

  const handleThemeSwitch = (key) => {
    setThemeKey(key);
    try { localStorage.setItem("bs_theme", key); } catch {}
  };

  const handleTagSaved = (tag) => {
    try {
      if (tag) { localStorage.setItem("bs_tag", tag); setSavedTag(tag); }
      else { localStorage.removeItem("bs_tag"); setSavedTag(null); }
    } catch {}
  };

  const nav = [
    { id: "search", label: "Joueur", key: "J" },
    { id: "brawlers", label: "Brawlers", key: "B" },
    { id: "rankings", label: "Top", key: "T" },
    { id: "clubs", label: "Clubs", key: "C" },
    { id: "events", label: "Events", key: "E" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${theme.bg}; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${theme.accent}44; border-radius: 2px; }
        input::placeholder { color: rgba(255,255,255,0.18); }
      `}</style>
      <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "DM Sans,sans-serif", color: theme.text, backgroundImage: theme.gradientTop }}>
        <header style={{ background: theme.headerBg, borderBottom: `1px solid ${theme.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentAlt})`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "Outfit,sans-serif" }}>BS</div>
          <div>
            <div style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: theme.text, fontSize: "0.97em", letterSpacing: "-0.02em" }}>BRAWL STATS</div>
            <div style={{ color: theme.textMuted, fontSize: "0.57em", letterSpacing: "0.2em", textTransform: "uppercase" }}>Tracker</div>
          </div>
          <div style={{ flex: 1 }} />
          <ThemeSwitcher currentTheme={themeKey} onSwitch={handleThemeSwitch} />
        </header>
        <main style={{ maxWidth: 660, margin: "0 auto", padding: "20px 16px 90px", animation: "fadeIn 0.28s ease" }} key={page}>
          {page === "search" && <PlayerSearchPage theme={theme} savedTag={savedTag} onTagSaved={handleTagSaved} />}
          {page === "brawlers" && <BrawlersPage theme={theme} />}
          {page === "rankings" && <RankingsPage theme={theme} />}
          {page === "clubs" && <ClubSearchPage theme={theme} />}
          {page === "events" && <EventsPage theme={theme} />}
        </main>
        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, borderTop: `1px solid ${theme.border}`, display: "flex", backdropFilter: "blur(24px)", zIndex: 100 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, background: "none", border: "none", padding: "9px 4px 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative" }}>
              {page === n.id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 2, background: theme.accent, borderRadius: 1 }} />}
              <div style={{ width: 22, height: 22, background: page === n.id ? `${theme.accent}20` : "transparent", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: page === n.id ? theme.accent : theme.textSub, fontSize: "0.72em", fontWeight: 800, fontFamily: "Outfit,sans-serif" }}>{n.key}</span>
              </div>
              <span style={{ color: page === n.id ? theme.accent : theme.textSub, fontSize: "0.6em", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "DM Sans,sans-serif", transition: "color 0.15s" }}>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
