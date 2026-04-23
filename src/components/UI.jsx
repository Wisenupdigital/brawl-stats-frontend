import { useState } from "react";
import { rarityColors, rarityGlow, getBrawlerImage, THEMES } from "../utils/constants";

export function LoadingSpinner({ accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 44 }}>
      <div style={{ width: 36, height: 36, border: `2.5px solid ${accent}22`, borderTop: `2.5px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72em", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "DM Sans,sans-serif" }}>Chargement</span>
    </div>
  );
}

export function StatBadge({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}22`, borderRadius: 10, padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, minWidth: 78 }}>
      <span style={{ color, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.05em", letterSpacing: "-0.03em" }}>
        {typeof value === "number" ? value.toLocaleString() : value ?? "--"}
      </span>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.62em", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "DM Sans,sans-serif" }}>{label}</span>
    </div>
  );
}

export function BrawlerCard({ brawler, theme }) {
  const rarity = brawler.rarity?.name || "Common";
  const color = rarityColors[rarity] || "#aaa";
  const [imgError, setImgError] = useState(false);
  const imgUrl = getBrawlerImage(brawler.name, brawler.id);
  return (
    <div
      style={{ background: theme.bgCard, border: `1px solid ${color}28`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "default", transition: "transform 0.16s, box-shadow 0.16s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = rarityGlow[rarity]; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {!imgError && imgUrl ? (
        <img src={imgUrl} alt={brawler.name} style={{ width: 54, height: 54, objectFit: "contain" }} onError={() => setImgError(true)} />
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

export function PlayerBrawlerRow({ b, accent }) {
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

export function RankingRow({ player, index, accent }) {
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

export function ThemeSwitcher({ currentTheme, onSwitch }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Object.entries(THEMES).map(([key, t]) => (
        <button key={key} onClick={() => onSwitch(key)} style={{ width: 26, height: 26, borderRadius: "50%", border: currentTheme === key ? `2px solid ${t.accent}` : "2px solid rgba(255,255,255,0.1)", background: `linear-gradient(135deg, ${t.accent}, ${t.accentAlt})`, cursor: "pointer", transition: "transform 0.15s", transform: currentTheme === key ? "scale(1.2)" : "scale(1)" }} title={t.name} />
      ))}
    </div>
  );
}

export function ResultPill({ result }) {
  const cfg = {
    victory: { label: "Victoire", bg: "rgba(76,175,117,0.12)", border: "rgba(76,175,117,0.3)", color: "#4caf75" },
    defeat:  { label: "Défaite",  bg: "rgba(232,85,85,0.1)",   border: "rgba(232,85,85,0.25)",  color: "#e85555" },
    draw:    { label: "Égalité",  bg: "rgba(150,150,150,0.08)", border: "rgba(150,150,150,0.2)", color: "#888" },
    unknown: { label: "—",        bg: "rgba(100,100,100,0.08)", border: "rgba(100,100,100,0.15)", color: "#555" },
  };
  const c = cfg[result] || cfg.unknown;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      fontSize: "0.62em", fontWeight: 700, letterSpacing: "0.07em",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 5,
      fontFamily: "'DM Sans', sans-serif",
    }}>{c.label}</span>
  );
}

export function TrophyChip({ delta }) {
  if (delta === null) return null;
  const pos = delta >= 0;
  return (
    <span style={{
      color: pos ? "#4caf75" : "#e85555",
      fontFamily: "'Outfit', sans-serif", fontWeight: 800,
      fontSize: "0.82em", letterSpacing: "-0.02em",
    }}>
      {pos ? "+" : ""}{delta} 🏆
    </span>
  );
}

export function BrawlerChip({ brawler }) {
  if (!brawler) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        background: "rgba(245,166,35,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.7em", fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: "#f5a623",
      }}>
        {brawler.name?.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div style={{ color: "#ccc", fontSize: "0.75em", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{brawler.name}</div>
        <div style={{ color: "#333", fontSize: "0.62em", fontFamily: "'DM Sans', sans-serif" }}>Lvl {brawler.power} · 🏆{brawler.trophies}</div>
      </div>
    </div>
  );
}

export function TeamRow({ teams, playerTag }) {
  if (!teams || teams.length === 0) return null;
  const clean = playerTag?.replace("#", "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {teams.map((team, ti) => (
        <div key={ti} style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          {/* Label équipe */}
          <div style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: "0.58em",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Équipe {ti + 1}
          </div>

          {/* Joueurs */}
          {team.map((p, pi) => {
            const isMe = p.tag?.replace("#", "") === clean;
            const brawlerName = p.brawler?.name || "";
            const imgUrl = brawlerName
              ? `https://cdn.brawlify.com/brawlers/borderless/${brawlerName.trim().replace(/\s+/g, "_")}.png`
              : null;

            return (
              <div key={pi} style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isMe ? "rgba(245,166,35,0.06)" : "transparent",
                borderRadius: 8,
                padding: "5px 6px",
                border: isMe ? "1px solid rgba(245,166,35,0.2)" : "1px solid transparent",
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
                    {p.brawler?.trophies ? `· 🏆 ${p.brawler.trophies}` : ""}
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
      ))}
    </div>
  );
}
