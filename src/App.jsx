import { useState, useEffect, useRef } from "react";

const API_BASE = "https://brawl-stats-backend.onrender.com/api";

const rarityColors = {
  "Common": "#90a4ae",
  "Rare": "#4caf75",
  "Super Rare": "#29b6f6",
  "Epic": "#9c6fde",
  "Mythic": "#e85555",
  "Legendary": "#f5a623",
};

const rarityGlow = {
  "Common": "0 0 8px #90a4ae44",
  "Rare": "0 0 10px #4caf7544",
  "Super Rare": "0 0 10px #29b6f644",
  "Epic": "0 0 12px #9c6fde55",
  "Mythic": "0 0 12px #e8555555",
  "Legendary": "0 0 20px #f5a62377, 0 0 40px #f5a62320",
};

async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchTrophyHistory(tag) {
  try {
    const res = await fetch(`${API_BASE}/players/${tag}/history?days=90`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.history || null;
  } catch {
    return null;
  }
}

function generateTrophyHistory(currentTrophies, highestTrophies) {
  const points = 14;
  const data = [];
  const peak = highestTrophies || currentTrophies;
  const base = Math.max(0, peak * 0.52);
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const trend = base + (peak - base) * Math.pow(t, 0.55);
    const wave = Math.sin(t * Math.PI * 2.4) * (peak - base) * 0.16;
    const noise = (Math.random() - 0.48) * (peak - base) * 0.08;
    data.push(Math.round(Math.max(base, Math.min(peak, trend + wave + noise))));
  }
  data[Math.round(points * 0.72)] = peak;
  data[points - 1] = currentTrophies;
  return data;
}

function TrophyChart({ trophies, highestTrophies }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const dataRef = useRef(generateTrophyHistory(trophies, highestTrophies));

  useEffect(() => {
    dataRef.current = generateTrophyHistory(trophies, highestTrophies);
    setProgress(0);
    let start = null;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, ease((ts - start) / 1500));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [trophies, highestTrophies]);

  const data = dataRef.current;
  const W = 540, H = 150;
  const PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const minV = Math.min(...data) * 0.9;
  const maxV = Math.max(...data) * 1.06;

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
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? "#f5a623" : "#e85555";

  const months = ["Jan","FÃ©v","Mar","Avr","Mai","Jun","Jul","AoÃ»","Sep","Oct","Nov","DÃ©c"];
  const now = new Date();

  const yTicks = [minV, (minV + maxV) / 2, maxV];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Y grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD.left - 7} y={toY(v) + 4} textAnchor="end" fill="#333" fontSize="9.5" fontFamily="'DM Sans', sans-serif">
            {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {data.map((_, i) => {
        if (i % 4 !== 0 && i !== data.length - 1) return null;
        const d = new Date(now); d.setMonth(now.getMonth() - (data.length - 1 - i));
        return (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#2e2e2e" fontSize="9.5" fontFamily="'DM Sans', sans-serif">
            {months[((d.getMonth()) + 12) % 12]}
          </text>
        );
      })}

      {/* Area */}
      {vd.length > 1 && <path d={areaD} fill="url(#chartArea)" />}

      {/* Line */}
      {vd.length > 1 && (
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      )}

      {/* Peak marker */}
      {(() => {
        const peakVal = Math.max(...vd);
        const peakI = vd.indexOf(peakVal);
        if (peakI < 0 || peakI === vd.length - 1) return null;
        return (
          <g>
            <circle cx={toX(peakI)} cy={toY(peakVal)} r={4} fill="#f5a623" stroke="#0d0f14" strokeWidth="2" />
            <text x={toX(peakI)} y={toY(peakVal) - 9} textAnchor="middle" fill="#f5a623" fontSize="9" fontWeight="700" fontFamily="'DM Sans', sans-serif">
              â–² {peakVal.toLocaleString()}
            </text>
          </g>
        );
      })()}

      {/* Current dot */}
      {vd.length > 1 && (() => {
        const last = vd[vd.length - 1];
        const x = toX(vd.length - 1), y = toY(last);
        return (
          <g>
            <circle cx={x} cy={y} r={5} fill={lineColor} stroke="#0d0f14" strokeWidth="2.5" />
            <circle cx={x} cy={y} r={9} fill={lineColor} fillOpacity="0.12" />
          </g>
        );
      })()}
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 44 }}>
      <div style={{ width: 36, height: 36, border: "2.5px solid rgba(245,166,35,0.15)", borderTop: "2.5px solid #f5a623", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "#333", fontSize: "0.75em", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Chargement</span>
    </div>
  );
}

function StatBadge({ label, value, icon, color = "#f5a623" }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}1e`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, minWidth: 78 }}>
      <span style={{ fontSize: "1em" }}>{icon}</span>
      <span style={{ color, fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1em", letterSpacing: "-0.03em" }}>{typeof value === "number" ? value.toLocaleString() : value ?? "â€”"}</span>
      <span style={{ color: "#2e2e2e", fontSize: "0.62em", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    </div>
  );
}

function BrawlerCard({ brawler }) {
  const rarity = brawler.rarity?.name || "Common";
  const color = rarityColors[rarity] || "#aaa";
  return (
    <div
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}28`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "default", transition: "transform 0.16s, box-shadow 0.16s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = rarityGlow[rarity]; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {brawler.imageUrl
        ? <img src={brawler.imageUrl} alt={brawler.name} style={{ width: 50, height: 50, objectFit: "contain" }} />
        : <div style={{ width: 50, height: 50, background: `${color}18`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>âš¡</div>
      }
      <span style={{ color: "#e0e0e0", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.78em", textAlign: "center" }}>{brawler.name}</span>
      <span style={{ color, fontSize: "0.6em", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>{rarity}</span>
    </div>
  );
}

function PlayerBrawlerRow({ b }) {
  const maxT = b.highestTrophies || b.trophies;
  const pct = maxT > 0 ? Math.min(100, (b.trophies / maxT) * 100) : 0;
  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "9px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, background: "rgba(245,166,35,0.08)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: "#f5a623", fontSize: "0.78em" }}>{b.rank ?? "?"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#d0d0d0", fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.83em" }}>{b.name}</div>
          <div style={{ color: "#383838", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>{b.trophies.toLocaleString()} Â· Best {maxT.toLocaleString()}</div>
        </div>
        <span style={{ color: "#383838", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>Lvl {b.power}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #f5a623, #ff6b35)", borderRadius: 4, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function ClubCard({ club }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 46, height: 46, background: "rgba(245,166,35,0.08)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>ðŸ›¡ï¸</div>
        <div>
          <div style={{ color: "#f5a623", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1em" }}>{club.name}</div>
          <div style={{ color: "#383838", fontSize: "0.78em", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{club.description || "Aucune description"}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatBadge label="Membres" value={club.members?.length} icon="ðŸ‘¥" color="#29b6f6" />
        <StatBadge label="TrophÃ©es" value={club.trophies} icon="ðŸ†" color="#f5a623" />
        <StatBadge label="Requis" value={club.requiredTrophies} icon="âš¡" color="#ff6b35" />
        <StatBadge label="Type" value={club.type} icon="ðŸ”’" color="#9c6fde" />
      </div>
      {club.members?.length > 0 && (
        <div>
          <div style={{ color: "#2a2a2a", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.13em", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>Top Membres</div>
          {club.members.slice(0, 8).map((m, i) => (
            <div key={m.tag} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: 7 }}>
              <span style={{ color: i < 3 ? ["#f5a623","#9e9e9e","#a07040"][i] : "#2a2a2a", fontSize: "0.73em", minWidth: 20, fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ flex: 1, color: "#bbb", fontSize: "0.82em", fontFamily: "'DM Sans', sans-serif" }}>{m.name}</span>
              <span style={{ color: "#f5a623", fontSize: "0.77em", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>ðŸ† {m.trophies?.toLocaleString()}</span>
              <span style={{ color: "#2a2a2a", fontSize: "0.65em", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 5, fontFamily: "'DM Sans', sans-serif" }}>{m.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankingRow({ player, index }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: index < 3 ? `rgba(245,166,35,${0.055 - index * 0.014})` : "rgba(255,255,255,0.02)", borderRadius: 10, border: index < 3 ? "1px solid rgba(245,166,35,0.14)" : "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ minWidth: 26, textAlign: "center", fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: index < 3 ? ["#f5a623","#9e9e9e","#a07040"][index] : "#282828", fontSize: index < 3 ? "1em" : "0.82em" }}>
        {index < 3 ? ["ðŸ¥‡","ðŸ¥ˆ","ðŸ¥‰"][index] : `#${index + 1}`}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#d8d8d8", fontSize: "0.87em", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{player.name}</div>
        {player.club?.name && <div style={{ color: "#333", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>ðŸ… {player.club.name}</div>}
      </div>
      <span style={{ color: "#f5a623", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.88em" }}>ðŸ† {player.trophies?.toLocaleString()}</span>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PAGES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function PlayerSearchPage() {
  const [tag, setTag] = useState("");
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const search = async () => {
    const clean = tag.trim().replace(/^#/, "").toUpperCase();
    if (!clean) return;
    setLoading(true); setError(null); setPlayer(null); setTab("overview");
    try { setPlayer(await apiFetch(`/players/%23${clean}`)); }
    catch { setError("Joueur introuvable. VÃ©rifie le tag (#ABC123...)"); }
    setLoading(false);
  };

  const tabs = [{ id: "overview", label: "AperÃ§u" }, { id: "chart", label: "ðŸ“ˆ Courbe" }, { id: "brawlers", label: "Brawlers" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Joueur</h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Cherche un profil par son tag</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="#TAG123..."
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: "0.92em", fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s", letterSpacing: "0.03em" }}
          onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.45)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        <button onClick={search} style={{ background: "#f5a623", border: "none", borderRadius: 10, padding: "11px 20px", color: "#0d0f14", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.88em", cursor: "pointer", letterSpacing: "0.02em", boxShadow: "0 4px 18px rgba(245,166,35,0.28)" }}>
          Chercher
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div style={{ background: "rgba(232,85,85,0.07)", border: "1px solid rgba(232,85,85,0.2)", borderRadius: 10, padding: 14, color: "#c94a4a", fontSize: "0.83em", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}

      {player && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
          {/* Header card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, display: "flex", gap: 14 }}>
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg, rgba(245,166,35,0.15), rgba(255,107,53,0.1))", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>ðŸŽ®</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#f0f0f0", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.12em", letterSpacing: "-0.025em" }}>{player.name}</div>
              <div style={{ color: "#2e2e2e", fontSize: "0.73em", fontFamily: "'DM Sans', sans-serif", marginTop: 1 }}>{player.tag}</div>
              {player.club?.name && <div style={{ color: "#f5a623", fontSize: "0.76em", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>ðŸ… {player.club.name}</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "#f5a623", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.3em", letterSpacing: "-0.04em" }}>{player.trophies?.toLocaleString()}</div>
              <div style={{ color: "#282828", fontSize: "0.67em", fontFamily: "'DM Sans', sans-serif" }}>ðŸ† trophÃ©es</div>
              <div style={{ color: "#222", fontSize: "0.65em", fontFamily: "'DM Sans', sans-serif" }}>Best {player.highestTrophies?.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 7 }}>
            <StatBadge label="3v3" value={player["3vs3Victories"]} icon="âš”ï¸" color="#29b6f6" />
            <StatBadge label="Solo" value={player.soloVictories} icon="ðŸŽ¯" color="#4caf75" />
            <StatBadge label="Duo" value={player.duoVictories} icon="ðŸ‘¥" color="#9c6fde" />
            <StatBadge label="Niveau" value={player.expLevel} icon="â­" color="#f5a623" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, background: tab === t.id ? "#f5a623" : "transparent",
                border: "none", borderRadius: 8, padding: "7px 8px",
                color: tab === t.id ? "#0d0f14" : "#333",
                fontFamily: "'Outfit', sans-serif", fontWeight: tab === t.id ? 700 : 500,
                fontSize: "0.76em", cursor: "pointer", transition: "all 0.18s", whiteSpace: "nowrap"
              }}>{t.label}</button>
            ))}
          </div>

          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ label: "Niveau EXP", val: player.expLevel, sub: `${player.expPoints?.toLocaleString()} pts`, c: "#f5a623" }, { label: "Brawlers", val: player.brawlers?.length, sub: "dÃ©bloquÃ©s", c: "#29b6f6" }].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14 }}>
                    <div style={{ color: "#252525", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 5 }}>{s.label}</div>
                    <div style={{ color: s.c, fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{s.val}</div>
                    <div style={{ color: "#252525", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 14 }}>
                <div style={{ color: "#252525", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Top Brawlers</div>
                {player.brawlers?.sort((a, b) => b.trophies - a.trophies).slice(0, 5).map((b, i) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <span style={{ color: i < 3 ? ["#f5a623","#9e9e9e","#a07040"][i] : "#252525", fontSize: "0.78em", minWidth: 20, fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>{i < 3 ? ["ðŸ¥‡","ðŸ¥ˆ","ðŸ¥‰"][i] : `#${i+1}`}</span>
                    <span style={{ flex: 1, color: "#bbb", fontSize: "0.84em", fontFamily: "'DM Sans', sans-serif" }}>{b.name}</span>
                    <span style={{ color: "#f5a623", fontSize: "0.8em", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>ðŸ† {b.trophies.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "chart" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ color: "#888", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Progression TrophÃ©es</div>
                    <div style={{ color: "#f5a623", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{player.trophies?.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#888", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Record</div>
                    <div style={{ color: "#29b6f6", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{player.highestTrophies?.toLocaleString()}</div>
                  </div>
                </div>
                <TrophyChart trophies={player.trophies} highestTrophies={player.highestTrophies} />
                <div style={{ display: "flex", gap: 14, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f5a623" }} />
                    <span style={{ color: "#2e2e2e", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>Progression</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f5a623", border: "2px solid #0d0f14" }} />
                    <span style={{ color: "#2e2e2e", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>â–² Record Â· â— Actuel</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.1)", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "#2e2e2e", fontSize: "0.72em", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55 }}>
                  â„¹ï¸ Courbe gÃ©nÃ©rÃ©e Ã  partir de la progression trophÃ©es actuels / record. L'API Brawl Stars ne propose pas d'historique temporel natif â€” intÃ¨gre un backend pour persister les snapshots.
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 16 }}>
                <div style={{ color: "#252525", fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>Top 5 â€” TrophÃ©es vs Record</div>
                {player.brawlers?.sort((a, b) => b.trophies - a.trophies).slice(0, 5).map(b => {
                  const max = b.highestTrophies || b.trophies;
                  const pct = max > 0 ? (b.trophies / max) * 100 : 0;
                  return (
                    <div key={b.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ color: "#aaa", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82em" }}>{b.name}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ color: "#f5a623", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.8em" }}>{b.trophies.toLocaleString()}</span>
                          <span style={{ color: "#252525", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif" }}>/ {max.toLocaleString()}</span>
                        </div>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #f5a623cc, #ff6b35cc)", borderRadius: 4, transition: "width 1.1s cubic-bezier(.4,0,.2,1)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "brawlers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {player.brawlers?.sort((a, b) => b.trophies - a.trophies).map(b => <PlayerBrawlerRow key={b.id} b={b} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrawlersPage() {
  const [brawlers, setBrawlers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    apiFetch("/brawlers?limit=100").then(d => setBrawlers(d.items || [])).catch(() => setBrawlers([])).finally(() => setLoading(false));
  }, []);

  const rarities = ["All", ...Object.keys(rarityColors)];
  const filtered = brawlers.filter(b => (filter === "All" || b.rarity?.name === filter) && b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Brawlers</h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>{brawlers.length} brawlers dans le jeu</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
        style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", color: "#e0e0e0", fontSize: "0.88em", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
        onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.4)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
      />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {rarities.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{ background: filter === r ? (rarityColors[r] || "#f5a623") : "rgba(255,255,255,0.03)", border: `1px solid ${rarityColors[r] ? rarityColors[r] + "33" : "rgba(255,255,255,0.05)"}`, borderRadius: 7, padding: "4px 11px", color: filter === r ? "#0d0f14" : "#3e3e3e", fontSize: "0.7em", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em", transition: "all 0.15s" }}>{r}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))", gap: 8 }}>
          {filtered.map(b => <BrawlerCard key={b.id} brawler={b} />)}
        </div>
      )}
    </div>
  );
}

function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("global");
  const countries = [{ code: "global", label: "ðŸŒ Global" }, { code: "FR", label: "ðŸ‡«ðŸ‡· France" }, { code: "US", label: "ðŸ‡ºðŸ‡¸ USA" }, { code: "JP", label: "ðŸ‡¯ðŸ‡µ Japon" }, { code: "BR", label: "ðŸ‡§ðŸ‡· BrÃ©sil" }, { code: "DE", label: "ðŸ‡©ðŸ‡ª Allemagne" }];

  useEffect(() => {
    setLoading(true);
    const ep = country === "global" ? "/rankings/global/players?limit=25" : `/rankings/${country}/players?limit=25`;
    apiFetch(ep).then(d => setRankings(d.items || [])).catch(() => setRankings([])).finally(() => setLoading(false));
  }, [country]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Classements</h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Top 25 joueurs</p>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {countries.map(c => (
          <button key={c.code} onClick={() => setCountry(c.code)} style={{ background: country === c.code ? "#f5a623" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "5px 11px", color: country === c.code ? "#0d0f14" : "#3a3a3a", fontSize: "0.77em", fontWeight: country === c.code ? 700 : 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}>{c.label}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {rankings.length === 0
            ? <div style={{ color: "#252525", textAlign: "center", padding: 30, fontFamily: "'DM Sans', sans-serif", fontSize: "0.85em" }}>Aucun classement disponible</div>
            : rankings.map((p, i) => <RankingRow key={p.tag} player={p} index={i} />)}
        </div>
      )}
    </div>
  );
}

function ClubSearchPage() {
  const [tag, setTag] = useState("");
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Clubs</h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Recherche par tag</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="#CLUBTAG..."
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", color: "#e0e0e0", fontSize: "0.92em", fontFamily: "'DM Sans', sans-serif", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.45)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        <button onClick={search} style={{ background: "#f5a623", border: "none", borderRadius: 10, padding: "11px 20px", color: "#0d0f14", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.88em", cursor: "pointer" }}>Chercher</button>
      </div>
      {loading && <LoadingSpinner />}
      {error && <div style={{ background: "rgba(232,85,85,0.07)", border: "1px solid rgba(232,85,85,0.18)", borderRadius: 10, padding: 14, color: "#c94a4a", fontSize: "0.83em", fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
      {club && <ClubCard club={club} />}
    </div>
  );
}

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch("/events/rotation").then(d => setEvents(d.items || d || [])).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  const modeColors = { gemGrab: "#9c6fde", brawlBall: "#29b6f6", heist: "#e85555", bounty: "#4caf75", siege: "#ff8c00", hotZone: "#ff6b35", knockout: "#e91e63", wipeout: "#f44336", duels: "#f5a623" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Ã‰vÃ©nements</h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>Rotation actuelle</p>
      </div>
      {loading ? <LoadingSpinner /> : events.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 36, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 10 }}>ðŸ—“ï¸</div>
          <div style={{ color: "#252525", fontFamily: "'DM Sans', sans-serif", fontSize: "0.83em" }}>Aucun Ã©vÃ©nement disponible</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
          {events.map((ev, i) => {
            const mode = ev.event?.mode || "unknown";
            const color = modeColors[mode] || "#f5a623";
            return (
              <div key={i} style={{ background: `${color}0d`, border: `1px solid ${color}22`, borderRadius: 12, padding: 14 }}>
                <div style={{ color, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.85em", textTransform: "capitalize" }}>{mode.replace(/([A-Z])/g, " $1").trim()}</div>
                <div style={{ color: "#bbb", fontSize: "0.82em", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>{ev.event?.map}</div>
                {ev.slotId && <div style={{ color: "#252525", fontSize: "0.68em", fontFamily: "'DM Sans', sans-serif", marginTop: 3 }}>Slot #{ev.slotId}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• APP ROOT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function BrawlStarsApp() {
  const [page, setPage] = useState("search");
  const nav = [
    { id: "search", label: "Joueur", icon: "ðŸ”" },
    { id: "brawlers", label: "Brawlers", icon: "âš¡" },
    { id: "rankings", label: "Top", icon: "ðŸ†" },
    { id: "clubs", label: "Clubs", icon: "ðŸ…" },
    { id: "events", label: "Events", icon: "ðŸ—“ï¸" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0f14; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.25); border-radius: 2px; }
        input::placeholder { color: #1e1e1e; font-family: 'DM Sans', sans-serif; }
      `}</style>
      <div style={{ minHeight: "100vh", background: "#0d0f14", fontFamily: "'DM Sans', sans-serif", color: "#fff", backgroundImage: "radial-gradient(ellipse 90% 35% at 50% -5%, rgba(245,166,35,0.05) 0%, transparent 65%)" }}>
        <header style={{ background: "rgba(10,12,16,0.9)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)" }}>
          <div style={{ width: 32, height: 32, background: "#f5a623", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>âš¡</div>
          <div>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#f0f0f0", fontSize: "0.97em", letterSpacing: "-0.02em" }}>BRAWL STATS</div>
            <div style={{ color: "#1e1e1e", fontSize: "0.57em", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Tracker</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: "#1a1a1a", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)" }}>API v1</div>
        </header>

        <main style={{ maxWidth: 660, margin: "0 auto", padding: "20px 16px 90px", animation: "fadeIn 0.28s ease" }} key={page}>
          {page === "search" && <PlayerSearchPage />}
          {page === "brawlers" && <BrawlersPage />}
          {page === "rankings" && <RankingsPage />}
          {page === "clubs" && <ClubSearchPage />}
          {page === "events" && <EventsPage />}
        </main>

        <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(8,10,14,0.97)", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", backdropFilter: "blur(24px)", zIndex: 100 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ flex: 1, background: "none", border: "none", padding: "9px 4px 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative" }}>
              {page === n.id && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 22, height: 2, background: "#f5a623", borderRadius: 1 }} />}
              <span style={{ fontSize: "1.2em" }}>{n.icon}</span>
              <span style={{ color: page === n.id ? "#f5a623" : "#252525", fontSize: "0.6em", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif", transition: "color 0.15s" }}>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
