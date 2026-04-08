import { useState, useEffect } from "react";
import { apiFetch, rarityColors } from "../utils/constants";
import { LoadingSpinner, BrawlerCard, RankingRow, StatBadge } from "../components/UI";
import { BrawlersPageNew } from "../components/BrawlerDetail";

// ============================================================
//  BRAWLERS PAGE
// ============================================================
export function BrawlersPage({ theme }) {
  return <BrawlersPageNew theme={theme} />;
}


// ============================================================
//  RANKINGS PAGE
// ============================================================
export function RankingsPage({ theme }) {
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
export function ClubSearchPage({ theme }) {
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
export function EventsPage({ theme }) {
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
