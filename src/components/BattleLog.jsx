import { useState, useEffect } from "react";
import { apiFetch, getMeta, getResult, getTrophyDelta, getPlayerBrawler, getTeams, formatTime } from "../utils/constants";
import { ResultPill, TrophyChip, BrawlerChip, TeamRow, LoadingSpinner } from "./UI";

// ── BattleCard ────────────────────────────────────────────────────────────────
export function BattleCard({ battle, playerTag, index }) {
  const [expanded, setExpanded] = useState(false);
  const result = getResult(battle, playerTag);
  const delta = getTrophyDelta(battle);
  const brawler = getPlayerBrawler(battle, playerTag);
  const teams = getTeams(battle);
  const meta = getMeta(battle.event?.mode);
  const rank = battle.battle?.rank;

  const borderColor = result === "victory" ? "rgba(76,175,117,0.2)"
    : result === "defeat" ? "rgba(232,85,85,0.15)"
    : "rgba(255,255,255,0.05)";

  const bgGlow = result === "victory" ? "rgba(76,175,117,0.03)"
    : result === "defeat" ? "rgba(232,85,85,0.025)"
    : "transparent";

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: `${bgGlow}`,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: "12px 14px",
        cursor: "pointer",
        transition: "all 0.18s",
        animation: `fadeIn 0.28s ease ${index * 0.035}s both`,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = result === "victory" ? "rgba(76,175,117,0.4)" : result === "defeat" ? "rgba(232,85,85,0.3)" : "rgba(255,255,255,0.1)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Mode icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${meta.color}15`,
          border: `1px solid ${meta.color}25`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>
          {meta.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: "#d0d0d0", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.85em" }}>
              {meta.label}
            </span>
            <ResultPill result={result} />
            {rank !== undefined && (
              <span style={{ color: "#555", fontSize: "0.68em", fontFamily: "'DM Sans', sans-serif" }}>
                Rank #{rank}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            {battle.event?.map && (
              <span style={{ color: "#383838", fontSize: "0.7em", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                🗺 {battle.event.map}
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <TrophyChip delta={delta} />
          <span style={{ color: "#2a2a2a", fontSize: "0.64em", fontFamily: "'DM Sans', sans-serif" }}>
            {formatTime(battle.battleTime)}
          </span>
          <span style={{ color: "#222", fontSize: "0.58em" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", flexDirection: "column", gap: 8 }}>
          {brawler && (
            <div>
              <div style={{ color: "#252525", fontSize: "0.6em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 5 }}>Ton brawler</div>
              <BrawlerChip brawler={brawler} />
            </div>
          )}
          {teams.length > 0 && (
            <div>
              <div style={{ color: "#252525", fontSize: "0.6em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Équipes</div>
              <TeamRow teams={teams} playerTag={playerTag} />
            </div>
          )}
          {battle.battle?.players?.length > 0 && (
  <div>
    <div style={{ color: "#252525", fontSize: "0.6em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>Joueurs</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {battle.battle.players.map((p, i) => {
        const isMe = p.tag?.replace("#", "") === playerTag?.replace("#", "");
        const brawlerName = p.brawler?.name || "";
        const imgUrl = p.brawler?.id
          ? `https://cdn.brawlify.com/brawlers/borderless/${p.brawler.id}.png`
          : brawlerName
            ? `https://cdn.brawlify.com/brawlers/borderless/${brawlerName.trim().replace(/\s+/g, "_")}.png`
            : null;

        return (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: isMe ? "rgba(245,166,35,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isMe ? "rgba(245,166,35,0.2)" : "rgba(255,255,255,0.05)"}`,
            borderRadius: 8,
            padding: "5px 8px",
          }}>
            {/* Image brawler */}
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              borderRadius: 10,
              background: isMe ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isMe ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.08)"}`,
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={brawlerName}
                  style={{ width: 34, height: 34, objectFit: "contain" }}
                  onError={e => {
                    e.target.style.display = "none";
                    e.target.parentNode.innerHTML = `<span style="font-size:0.65em;font-weight:800;color:${isMe ? "#f5a623" : "#555"};font-family:Outfit,sans-serif">${brawlerName.slice(0,2).toUpperCase()}</span>`;
                  }}
                />
              ) : (
                <span style={{ fontSize: "0.65em", fontWeight: 800, color: isMe ? "#f5a623" : "#555", fontFamily: "Outfit,sans-serif" }}>??</span>
              )}
            </div>

            {/* Infos joueur */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: isMe ? "#f5a623" : "rgba(255,255,255,0.8)",
                fontSize: "0.78em",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: isMe ? 700 : 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {p.name || "???"}
                {isMe && <span style={{ fontSize: "0.75em", marginLeft: 5, opacity: 0.7 }}>· toi</span>}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.67em",
                fontFamily: "'DM Sans', sans-serif",
                marginTop: 1,
              }}>
                {p.brawler?.trophies ? `🏆 ${p.brawler.trophies}` : ""}
              </div>
            </div>

            {/* Power level */}
            {p.brawler?.power && (
              <div style={{
                flexShrink: 0,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 6,
                padding: "2px 7px",
                color: "rgba(255,255,255,0.35)",
                fontSize: "0.65em",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
              }}>
                Lvl {p.brawler.power}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
}

// ── BattleStats ───────────────────────────────────────────────────────────────
export function BattleStats({ battles, playerTag }) {
  const results = battles.map(b => getResult(b, playerTag));
  const wins = results.filter(r => r === "victory").length;
  const losses = results.filter(r => r === "defeat").length;
  const draws = results.filter(r => r === "draw").length;
  const total = battles.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const trophyDeltas = battles.map(b => getTrophyDelta(b)).filter(t => t !== null);
  const netTrophies = trophyDeltas.reduce((a, b) => a + b, 0);

  const modeCounts = {};
  battles.forEach(b => {
    const m = b.event?.mode || "unknown";
    modeCounts[m] = (modeCounts[m] || 0) + 1;
  });
  const topMode = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0];
  const topMeta = topMode ? getMeta(topMode[0]) : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14, padding: 14,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
          <span style={{ color: "#555", fontSize: "0.62em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Sans', sans-serif" }}>
            Win rate — {total} parties
          </span>
          <span style={{ color: winRate >= 50 ? "#4caf75" : "#e85555", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.95em" }}>
            {winRate}%
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${(wins / total) * 100}%`, background: "#4caf75", transition: "width 1s" }} />
          <div style={{ width: `${(draws / total) * 100}%`, background: "#888" }} />
          <div style={{ width: `${(losses / total) * 100}%`, background: "#e85555" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {[
            { label: "V", val: wins, color: "#4caf75" },
            { label: "N", val: draws, color: "#888" },
            { label: "D", val: losses, color: "#e85555" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
              <span style={{ color: s.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.78em" }}>{s.val}</span>
              <span style={{ color: "#333", fontSize: "0.65em", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "8px 10px" }}>
          <div style={{ color: "#333", fontSize: "0.6em", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Trophées nets</div>
          <div style={{ color: netTrophies >= 0 ? "#4caf75" : "#e85555", fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.1em", letterSpacing: "-0.03em", marginTop: 2 }}>
            {netTrophies >= 0 ? "+" : ""}{netTrophies} 🏆
          </div>
        </div>
        {topMeta && (
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "8px 10px" }}>
            <div style={{ color: "#333", fontSize: "0.6em", fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mode favori</div>
            <div style={{ color: topMeta.color, fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "0.82em", marginTop: 2 }}>
              {topMeta.icon} {topMeta.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
export function FilterBar({ active, onChange }) {
  const filters = [
    { id: "all", label: "Tout" },
    { id: "victory", label: "✅ Victoires" },
    { id: "defeat", label: "❌ Défaites" },
    { id: "ranked", label: "🏆 Ranked" },
  ];
  return (
    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
      {filters.map(f => (
        <button key={f.id} onClick={() => onChange(f.id)} style={{
          background: active === f.id ? "#f5a623" : "rgba(255,255,255,0.03)",
          border: `1px solid ${active === f.id ? "#f5a623" : "rgba(255,255,255,0.06)"}`,
          borderRadius: 7, padding: "4px 12px",
          color: active === f.id ? "#0d0f14" : "#3a3a3a",
          fontSize: "0.7em", fontWeight: active === f.id ? 700 : 500,
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}>{f.label}</button>
      ))}
    </div>
  );
}

// ── BattleLogPage (standalone) ────────────────────────────────────────────────
export function BattleLogPage() {
  const [tag, setTag] = useState("");
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchedTag, setSearchedTag] = useState(null);

  const search = async () => {
    const clean = tag.trim().replace(/^#/, "").toUpperCase();
    if (!clean) return;
    setLoading(true); setError(null); setBattles([]); setSearchedTag(null); setFilter("all");
    try {
      const data = await apiFetch(`/players/%23${clean}/battlelog`);
      setBattles(data.items || []);
      setSearchedTag(`#${clean}`);
    } catch {
      setError("Battle log introuvable. Vérifie le tag du joueur.");
    }
    setLoading(false);
  };

  const filtered = battles.filter(b => {
    if (filter === "all") return true;
    if (filter === "victory") return getResult(b, searchedTag) === "victory";
    if (filter === "defeat") return getResult(b, searchedTag) === "defeat";
    if (filter === "ranked") return b.event?.mode?.toLowerCase().includes("ranked");
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>
          Battle Log
        </h2>
        <p style={{ color: "#2e2e2e", fontSize: "0.78em", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
          25 dernières parties
        </p>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={tag}
          onChange={e => setTag(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="#TAG123..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 10,
            padding: "11px 14px", color: "#e0e0e0", fontSize: "0.92em",
            fontFamily: "'DM Sans', sans-serif", outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(245,166,35,0.45)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        <button onClick={search} style={{
          background: "#f5a623", border: "none", borderRadius: 10,
          padding: "11px 20px", color: "#0d0f14",
          fontFamily: "'Outfit', sans-serif", fontWeight: 700,
          fontSize: "0.88em", cursor: "pointer",
          boxShadow: "0 4px 18px rgba(245,166,35,0.28)",
        }}>
          Chercher
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 44 }}>
          <div style={{ width: 36, height: 36, border: "2.5px solid rgba(245,166,35,0.15)", borderTop: "2.5px solid #f5a623", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <span style={{ color: "#333", fontSize: "0.75em", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>Chargement</span>
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(232,85,85,0.07)", border: "1px solid rgba(232,85,85,0.2)", borderRadius: 10, padding: 14, color: "#c94a4a", fontSize: "0.83em", fontFamily: "'DM Sans', sans-serif" }}>
          {error}
        </div>
      )}

      {battles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.3s ease" }}>
          <BattleStats battles={battles} playerTag={searchedTag} />
          <FilterBar active={filter} onChange={setFilter} />
          <div style={{ color: "#252525", fontSize: "0.65em", fontFamily: "'DM Sans', sans-serif" }}>
            {filtered.length} partie{filtered.length > 1 ? "s" : ""} · Tape sur une carte pour les détails
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {filtered.map((b, i) => (
              <BattleCard key={i} battle={b} playerTag={searchedTag} index={i} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#252525", padding: 30, fontFamily: "'DM Sans', sans-serif", fontSize: "0.83em" }}>
              Aucune partie pour ce filtre
            </div>
          )}
        </div>
      )}

      {!loading && !error && battles.length === 0 && !searchedTag && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚔️</div>
          <div style={{ color: "#252525", fontFamily: "'DM Sans', sans-serif", fontSize: "0.83em", lineHeight: 1.6 }}>
            Entre le tag d'un joueur<br />pour voir ses dernières parties
          </div>
        </div>
      )}
    </div>
  );
}

// ── BattleLogInline (dans PlayerSearchPage) ───────────────────────────────────
export function BattleLogInline({ tag }) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!tag) return;
    setLoading(true);
    const clean = tag.replace(/^#/, "");
    apiFetch(`/players/%23${clean}/battlelog`)
      .then(d => setBattles(d.items || []))
      .catch(() => setError("Battle log indisponible"))
      .finally(() => setLoading(false));
  }, [tag]);

  const filtered = battles.filter(b => {
    if (filter === "all") return true;
    if (filter === "victory") return getResult(b, tag) === "victory";
    if (filter === "defeat") return getResult(b, tag) === "defeat";
    if (filter === "ranked") return b.event?.mode?.toLowerCase().includes("ranked");
    return true;
  });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 36, gap: 10 }}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(245,166,35,0.15)", borderTop: "2px solid #f5a623", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "#333", fontSize: "0.75em", fontFamily: "'DM Sans', sans-serif" }}>Chargement du battle log…</span>
    </div>
  );

  if (error) return (
    <div style={{ background: "rgba(232,85,85,0.07)", border: "1px solid rgba(232,85,85,0.18)", borderRadius: 10, padding: 14, color: "#c94a4a", fontSize: "0.8em", fontFamily: "'DM Sans', sans-serif" }}>
      {error}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {battles.length > 0 && <BattleStats battles={battles} playerTag={tag} />}
      <FilterBar active={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {filtered.map((b, i) => (
          <BattleCard key={i} battle={b} playerTag={tag} index={i} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#252525", padding: 24, fontFamily: "'DM Sans', sans-serif", fontSize: "0.82em" }}>
          Aucune partie pour ce filtre
        </div>
      )}
    </div>
  );
}
