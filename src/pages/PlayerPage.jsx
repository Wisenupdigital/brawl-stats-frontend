import { useState, useEffect } from "react";
import { API_BASE, apiFetch, getBrawlerImage } from "../utils/constants";
import { LoadingSpinner, StatBadge, PlayerBrawlerRow } from "../components/UI";
import TrophyChart from "../components/TrophyChart";
import { BattleLogInline } from "../components/BattleLog";
import PlayerOverview from "../components/PlayerOverview";

// ── BattleLog legacy (tab "Batailles") ───────────────────────────────────────
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
                src={`https://cdn.brawlify.com/brawler/borderless/${myBrawler.name.trim().replace(/\s+/g, "_")}.png`}
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

// ── PlayerSearchPage ──────────────────────────────────────────────────────────
export default function PlayerSearchPage({ theme, savedTag, onTagSaved }) {
  const [tag, setTag] = useState(savedTag || "");
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [history, setHistory] = useState(null);
  const t = theme;

  const doSearch = async (searchTag) => {
    const clean = (searchTag || tag).trim().replace(/^#/, "").toUpperCase();
    if (!clean) return;
    setLoading(true); setError(null); setPlayer(null); setHistory(null); setTab("overview");
    try {
      const data = await apiFetch(`/players/%23${clean}`);
      setPlayer(data);
      onTagSaved(clean);
      fetch(`${API_BASE}/players/${clean}/track`, { method: "POST" }).catch(() => {});
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

  useEffect(() => {
    if (savedTag) doSearch(savedTag);
  }, []);

  const logout = () => {
    setPlayer(null); setTag(""); onTagSaved(null); setError(null); setHistory(null);
  };

  const tabs = [
    { id: "overview",  label: "Apercu" },
    { id: "chart",     label: "Courbe" },
    { id: "brawlers",  label: "Brawlers" },
    { id: "battles",   label: "Batailles" },
    { id: "battlelog", label: "⚔️ Parties" },
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
                  {player.brawlers?.sort((a, b) => b.trophies - a.trophies).slice(0, 5).map((b, i) => (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <img src={getBrawlerImage(b.name)} alt={b.name} style={{ width: 28, height: 28, objectFit: "contain" }} onError={e => { e.target.style.opacity = "0"; }} />
                      <span style={{ color: i < 3 ? [t.accent, "rgba(255,255,255,0.5)", "rgba(205,127,50,0.8)"][i] : "rgba(255,255,255,0.2)", fontSize: "0.78em", minWidth: 18, fontFamily: "Outfit,sans-serif", fontWeight: 800 }}>#{i + 1}</span>
                      <span style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: "0.84em", fontFamily: "DM Sans,sans-serif" }}>{b.name}</span>
                      <span style={{ color: t.accent, fontSize: "0.8em", fontFamily: "Outfit,sans-serif", fontWeight: 700 }}>{b.trophies.toLocaleString()}</span>
                    </div>
                  ))}
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
                  playerTag={player.tag}
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

          {/* Batailles legacy */}
          {tab === "battles" && (
            <BattleLog tag={player.tag.replace(/^#/, "")} theme={t} />
          )}

          {/* Parties — BattleLogInline */}
          {tab === "battlelog" && <BattleLogInline tag={player.tag} />}
        </div>
      )}
    </div>
  );
}
