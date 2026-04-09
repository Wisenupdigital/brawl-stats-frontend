import { getBrawlerImage } from "../utils/constants";
import { rarityColors } from "../utils/constants";

// ── Avatar joueur ─────────────────────────────────────────────
function PlayerAvatar({ iconId, expLevel, accent, size = 54 }) {
  const url = iconId
    ? `https://cdn.brawlify.com/profile-icons/regular/${iconId}.png`
    : null;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
        border: `2px solid ${accent}40`,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {url ? (
          <img
            src={url}
            alt="avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = `<span style="font-size:${size * 0.4}px;font-weight:800;color:${accent};font-family:Outfit,sans-serif">${expLevel}</span>`;
            }}
          />
        ) : (
          <span style={{ fontSize: size * 0.4, fontWeight: 800, color: accent, fontFamily: "Outfit,sans-serif" }}>
            {expLevel}
          </span>
        )}
      </div>
      {/* Badge niveau */}
      <div style={{
        position: "absolute", bottom: -4, right: -4,
        background: accent,
        borderRadius: 6,
        padding: "1px 5px",
        fontSize: "0.55em",
        fontWeight: 800,
        color: "#fff",
        fontFamily: "Outfit,sans-serif",
        border: "1.5px solid rgba(0,0,0,0.3)",
      }}>{expLevel}</div>
    </div>
  );
}

// ── Podium top 3 ──────────────────────────────────────────────
function BrawlerPodium({ brawlers, accent }) {
  const sorted = [...(brawlers || [])].sort((a, b) => b.trophies - a.trophies).slice(0, 3);
  if (sorted.length < 1) return null;

  const podiumOrder = sorted.length >= 3
    ? [sorted[1], sorted[0], sorted[2]]
    : sorted.length === 2
    ? [sorted[1], sorted[0]]
    : [sorted[0]];

  const heights = [80, 100, 70];
  const medals = ["🥈", "🥇", "🥉"];
  const ranks = sorted.length >= 3 ? [1, 0, 2] : [1, 0];

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 10,
      padding: "16px 0 0",
    }}>
      {podiumOrder.map((b, i) => {
        const rankIdx = ranks[i] ?? i;
        const isFirst = rankIdx === 0;
        const height = heights[i] || 70;
        const podiumColor = rankIdx === 0 ? "#f5a623" : rankIdx === 1 ? "#9e9e9e" : "#a07040";

        return (
          <div key={b.id} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            flex: isFirst ? 1.2 : 1,
          }}>
            {/* Image brawler */}
            <div style={{
              width: isFirst ? 72 : 56,
              height: isFirst ? 72 : 56,
              borderRadius: 14,
              background: `${podiumColor}18`,
              border: `2px solid ${podiumColor}40`,
              overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isFirst ? `0 0 20px ${podiumColor}40` : "none",
              position: "relative",
            }}>
              <img
                src={getBrawlerImage(b.name, b.id)}
                alt={b.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = `<span style="font-size:1.4em;font-weight:800;color:${podiumColor};font-family:Outfit,sans-serif">${b.name.charAt(0)}</span>`;
                }}
              />
              {isFirst && (
                <div style={{
                  position: "absolute", top: -8, left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "1.1em",
                }}>👑</div>
              )}
            </div>

            {/* Nom */}
            <div style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: "0.68em",
              fontFamily: "Outfit,sans-serif",
              fontWeight: 700,
              textAlign: "center",
              textTransform: "capitalize",
              maxWidth: 70,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {b.name.charAt(0) + b.name.slice(1).toLowerCase()}
            </div>

            {/* Trophées */}
            <div style={{
              color: podiumColor,
              fontSize: "0.75em",
              fontFamily: "Outfit,sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}>
              {b.trophies.toLocaleString()}
            </div>

            {/* Socle podium */}
            <div style={{
              width: "100%",
              height,
              background: `linear-gradient(180deg, ${podiumColor}20, ${podiumColor}08)`,
              border: `1px solid ${podiumColor}25`,
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: 8,
            }}>
              <span style={{ fontSize: isFirst ? "1.3em" : "1em" }}>{medals[i]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Trophées par seuil ────────────────────────────────────────
function TrophyMilestones({ brawlers, accent }) {
  const thresholds = [
    { label: "300+", min: 300, color: "#90a4ae" },
    { label: "500+", min: 500, color: "#4caf75" },
    { label: "750+", min: 750, color: "#f5a623" },
    { label: "1000+", min: 1000, color: "#29b6f6" },
  ];

  const counts = thresholds.map(t => ({
    ...t,
    count: (brawlers || []).filter(b => b.trophies >= t.min).length,
  }));

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.6em",
        textTransform: "uppercase",
        letterSpacing: "0.13em",
        fontFamily: "DM Sans,sans-serif",
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        🏆 Trophées par seuil
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {counts.map(t => (
          <div key={t.label} style={{
            flex: 1,
            background: `${t.color}10`,
            border: `1px solid ${t.color}25`,
            borderRadius: 9,
            padding: "8px 6px",
            textAlign: "center",
          }}>
            <div style={{
              color: t.color,
              fontFamily: "Outfit,sans-serif",
              fontWeight: 800,
              fontSize: "1.15em",
              letterSpacing: "-0.03em",
            }}>{t.count}</div>
            <div style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.58em",
              fontFamily: "DM Sans,sans-serif",
              marginTop: 2,
            }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Répartition par rareté ────────────────────────────────────
function RarityBreakdown({ brawlers, theme }) {
  const t = theme;
  const rarityOrder = ["Common", "Rare", "Super Rare", "Epic", "Mythic", "Legendary"];

  // Totaux estimés par rareté (approximatif, varie selon updates du jeu)
  const rarityTotals = {
    "Common": 1,
    "Rare": 8,
    "Super Rare": 10,
    "Epic": 29,
    "Mythic": 38,
    "Legendary": 13,
  };

  const counts = rarityOrder.map(rarity => {
    const owned = (brawlers || []).filter(b => b.rarity?.name === rarity).length;
    const total = rarityTotals[rarity] || "?";
    const pct = typeof total === "number" ? Math.min(100, (owned / total) * 100) : 0;
    return { rarity, owned, total, pct, color: rarityColors[rarity] || "#aaa" };
  }).filter(r => r.owned > 0 || typeof r.total === "number");

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{
        color: "rgba(255,255,255,0.3)",
        fontSize: "0.6em",
        textTransform: "uppercase",
        letterSpacing: "0.13em",
        fontFamily: "DM Sans,sans-serif",
        marginBottom: 12,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        💎 Par rareté
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {counts.map(r => (
          <div key={r.rarity} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 80, flexShrink: 0,
              color: r.color,
              fontSize: "0.72em",
              fontFamily: "DM Sans,sans-serif",
              fontWeight: 600,
            }}>
              {r.rarity === "Super Rare" ? "S. Rare" : r.rarity}
            </div>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${r.pct}%`,
                height: "100%",
                background: r.color,
                borderRadius: 4,
                transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
                opacity: 0.85,
              }} />
            </div>
            <div style={{
              width: 36, flexShrink: 0,
              color: r.color,
              fontSize: "0.72em",
              fontFamily: "Outfit,sans-serif",
              fontWeight: 700,
              textAlign: "right",
            }}>
              {r.owned}/{r.total}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function PlayerOverview({ player, theme }) {
  const t = theme;
  const topBrawlers = [...(player.brawlers || [])].sort((a, b) => b.trophies - a.trophies).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Podium */}
      <div style={{
        background: t.bgCard,
        border: `1px solid ${t.border}`,
        borderRadius: 14,
        padding: "14px 14px 0",
        overflow: "hidden",
      }}>
        <div style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: "0.6em",
          textTransform: "uppercase",
          letterSpacing: "0.13em",
          fontFamily: "DM Sans,sans-serif",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          🏆 Top Brawlers
        </div>
        <BrawlerPodium brawlers={player.brawlers} accent={t.accent} />
      </div>

      {/* Stats rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Niveau EXP", val: player.expLevel, sub: `${player.expPoints?.toLocaleString()} pts`, c: t.accent },
          { label: "Brawlers", val: player.brawlers?.length, sub: "débloqués", c: "#29b6f6" },
        ].map(s => (
          <div key={s.label} style={{
            background: t.bgCard,
            border: `1px solid ${t.border}`,
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ color: t.textSub, fontSize: "0.67em", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "DM Sans,sans-serif", marginBottom: 5 }}>{s.label}</div>
            <div style={{ color: s.c, fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.7em", letterSpacing: "-0.04em" }}>{s.val}</div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7em", fontFamily: "DM Sans,sans-serif", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Trophées par seuil */}
      <TrophyMilestones brawlers={player.brawlers} accent={t.accent} />

      {/* Répartition par rareté */}
      <RarityBreakdown brawlers={player.brawlers} theme={t} />

    </div>
  );
}
