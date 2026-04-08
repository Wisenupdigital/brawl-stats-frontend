// ================================================================
// INSTRUCTIONS D'INTÉGRATION
// ================================================================
// 1. Dans src/utils/constants.js — REMPLACER la fonction getBrawlerImage :
//
//    export function getBrawlerImage(name, id) {
//      if (id) return `https://cdn.brawlify.com/brawler/borderless/${id}.png`;
//      if (!name) return null;
//      const clean = name.trim().replace(/\s+/g, "_");
//      return `https://cdn.brawlify.com/brawler/borderless/${clean}.png`;
//    }
//
// 2. Dans src/components/UI.jsx — MODIFIER BrawlerCard pour passer l'id :
//    Remplacer :  const imgUrl = getBrawlerImage(brawler.name);
//    Par :        const imgUrl = getBrawlerImage(brawler.name, brawler.id);
//
// 3. Dans src/components/UI.jsx — MODIFIER PlayerBrawlerRow pour passer l'id :
//    Remplacer :  <img src={getBrawlerImage(b.name)} ...
//    Par :        <img src={getBrawlerImage(b.name, b.id)} ...
//
// 4. Dans src/pages/OtherPages.jsx — REMPLACER BrawlersPage entière
//    par la version ci-dessous (BrawlersPageNew)
//
// 5. Dans src/App.jsx — import déjà présent, pas de changement nécessaire
// ================================================================

import { useState } from "react";
import { rarityColors, rarityGlow, apiFetch, getBrawlerImage } from "../utils/constants";
import { LoadingSpinner } from "./UI";

// ── Rarity badge ──────────────────────────────────────────────────────────────
function RarityBadge({ rarity }) {
  const color = rarityColors[rarity] || "#aaa";
  return (
    <span style={{
      background: `${color}18`,
      border: `1px solid ${color}44`,
      color,
      fontSize: "0.62em",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      padding: "2px 9px",
      borderRadius: 5,
      fontFamily: "DM Sans,sans-serif",
    }}>{rarity}</span>
  );
}

// ── Ability pill ──────────────────────────────────────────────────────────────
function AbilityPill({ name, color, icon }) {
  return (
    <div style={{
      background: `${color}12`,
      border: `1px solid ${color}28`,
      borderRadius: 8,
      padding: "7px 10px",
      display: "flex",
      alignItems: "center",
      gap: 7,
    }}>
      <span style={{ fontSize: "1em" }}>{icon}</span>
      <span style={{
        color: "rgba(255,255,255,0.82)",
        fontSize: "0.75em",
        fontFamily: "DM Sans,sans-serif",
        fontWeight: 500,
        lineHeight: 1.3,
        textTransform: "capitalize",
      }}>
        {name.charAt(0) + name.slice(1).toLowerCase()}
      </span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ label, color, icon }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginBottom: 8,
      marginTop: 14,
    }}>
      <span style={{ fontSize: "0.9em" }}>{icon}</span>
      <span style={{
        color,
        fontSize: "0.62em",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.13em",
        fontFamily: "DM Sans,sans-serif",
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `${color}22` }} />
    </div>
  );
}

// ── Brawler Detail Modal ──────────────────────────────────────────────────────
export function BrawlerDetailModal({ brawler, theme, onClose }) {
  const t = theme;
  const rarity = brawler.rarity?.name || "Common";
  const color = rarityColors[rarity] || "#aaa";
  const glow = rarityGlow[rarity] || "none";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 520,
          background: t.bg,
          borderTop: `1px solid ${color}30`,
          borderRadius: "20px 20px 0 0",
          padding: "0 0 40px",
          maxHeight: "88vh",
          overflowY: "auto",
          animation: "slideUp 0.22s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Header avec image */}
        <div style={{
          background: `linear-gradient(180deg, ${color}15 0%, transparent 100%)`,
          padding: "28px 20px 16px",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          position: "relative",
        }}>
          {/* Fermer */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%", width: 28, height: 28,
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.85em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          {/* Image brawler */}
          <div style={{
            width: 90, height: 90, flexShrink: 0,
            background: `${color}12`,
            borderRadius: 16,
            border: `1.5px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: glow,
            overflow: "hidden",
          }}>
            <img
              src={getBrawlerImage(brawler.name, brawler.id)}
              alt={brawler.name}
              style={{ width: 80, height: 80, objectFit: "contain" }}
              onError={e => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<span style="font-size:2em;font-weight:800;color:${color};font-family:Outfit,sans-serif">${brawler.name.charAt(0)}</span>`;
              }}
            />
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: t.text,
              fontFamily: "Outfit,sans-serif",
              fontWeight: 800,
              fontSize: "1.3em",
              letterSpacing: "-0.03em",
              textTransform: "capitalize",
              marginBottom: 6,
            }}>
              {brawler.name.charAt(0) + brawler.name.slice(1).toLowerCase()}
            </div>
            <RarityBadge rarity={rarity} />
            <div style={{
              color: t.textSub,
              fontSize: "0.67em",
              fontFamily: "DM Sans,sans-serif",
              marginTop: 8,
            }}>
              ID #{brawler.id}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: "0 20px" }}>

          {/* Star Powers */}
          {brawler.starPowers?.length > 0 && (
            <>
              <SectionTitle label="Star Powers" color="#f5a623" icon="⭐" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {brawler.starPowers.map(sp => (
                  <AbilityPill key={sp.id} name={sp.name} color="#f5a623" icon="⭐" />
                ))}
              </div>
            </>
          )}

          {/* Gadgets */}
          {brawler.gadgets?.length > 0 && (
            <>
              <SectionTitle label="Gadgets" color="#29b6f6" icon="⚙️" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {brawler.gadgets.map(g => (
                  <AbilityPill key={g.id} name={g.name} color="#29b6f6" icon="⚙️" />
                ))}
              </div>
            </>
          )}

          {/* Hypercharge */}
          {brawler.hyperCharges?.length > 0 && (
            <>
              <SectionTitle label="Hypercharge" color="#e85555" icon="⚡" />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {brawler.hyperCharges.map(h => (
                  <AbilityPill key={h.id} name={h.name} color="#e85555" icon="⚡" />
                ))}
              </div>
            </>
          )}

          {/* Gears */}
          {brawler.gears?.length > 0 && (
            <>
              <SectionTitle label="Gears disponibles" color="#9c6fde" icon="🔩" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {brawler.gears.map(g => (
                  <span key={g.id} style={{
                    background: "rgba(156,111,222,0.1)",
                    border: "1px solid rgba(156,111,222,0.2)",
                    borderRadius: 6,
                    padding: "3px 10px",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.7em",
                    fontFamily: "DM Sans,sans-serif",
                    textTransform: "capitalize",
                  }}>
                    {g.name.charAt(0) + g.name.slice(1).toLowerCase()}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Résumé counts */}
          <div style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            padding: "12px 0",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            {[
              { label: "Star Powers", val: brawler.starPowers?.length || 0, color: "#f5a623" },
              { label: "Gadgets", val: brawler.gadgets?.length || 0, color: "#29b6f6" },
              { label: "Hypercharge", val: brawler.hyperCharges?.length || 0, color: "#e85555" },
              { label: "Gears", val: brawler.gears?.length || 0, color: "#9c6fde" },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${s.color}22`,
                borderRadius: 9,
                padding: "8px 6px",
                textAlign: "center",
              }}>
                <div style={{
                  color: s.color,
                  fontFamily: "Outfit,sans-serif",
                  fontWeight: 800,
                  fontSize: "1.1em",
                }}>{s.val}</div>
                <div style={{
                  color: t.textSub,
                  fontSize: "0.55em",
                  fontFamily: "DM Sans,sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── BrawlerCard cliquable ─────────────────────────────────────────────────────
export function BrawlerCardClickable({ brawler, theme, onClick }) {
  const rarity = brawler.rarity?.name || "Common";
  const color = rarityColors[rarity] || "#aaa";
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onClick(brawler)}
      style={{
        background: theme.bgCard,
        border: `1px solid ${color}28`,
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        transition: "transform 0.16s, box-shadow 0.16s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = rarityGlow[rarity];
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {!imgError ? (
        <img
          src={getBrawlerImage(brawler.name, brawler.id)}
          alt={brawler.name}
          style={{ width: 54, height: 54, objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={{
          width: 54, height: 54,
          background: `${color}18`,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color,
          fontFamily: "Outfit,sans-serif", fontWeight: 800,
        }}>
          {brawler.name?.charAt(0)}
        </div>
      )}
      <span style={{
        color: theme.text,
        fontFamily: "Outfit,sans-serif",
        fontWeight: 600,
        fontSize: "0.78em",
        textAlign: "center",
        textTransform: "capitalize",
      }}>
        {brawler.name.charAt(0) + brawler.name.slice(1).toLowerCase()}
      </span>
      <span style={{
        color,
        fontSize: "0.6em",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontFamily: "DM Sans,sans-serif",
      }}>{rarity}</span>
    </div>
  );
}

// ── BrawlersPage complète avec modal ─────────────────────────────────────────
export function BrawlersPageNew({ theme }) {
  const [brawlers, setBrawlers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const t = theme;

  useState(() => {
    setLoading(true);
    apiFetch("/brawlers?limit=200")
      .then(d => setBrawlers(d.items || []))
      .catch(() => setBrawlers([]))
      .finally(() => setLoading(false));
  }, []);

  const rarities = ["All", "Common", "Rare", "Super Rare", "Epic", "Mythic", "Legendary"];
  const filtered = brawlers.filter(b =>
    (filter === "All" || b.rarity?.name === filter) &&
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, color: t.text, fontSize: "1.45em", letterSpacing: "-0.03em", margin: 0 }}>Brawlers</h2>
          <p style={{ color: t.textSub, fontSize: "0.78em", margin: "3px 0 0", fontFamily: "DM Sans,sans-serif" }}>{brawlers.length} brawlers · Tape pour voir la fiche</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: t.text, fontSize: "0.88em", outline: "none", fontFamily: "DM Sans,sans-serif" }}
          onFocus={e => e.target.style.borderColor = `${t.accent}88`}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
        />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {rarities.map(r => {
            const color = rarityColors[r];
            return (
              <button key={r} onClick={() => setFilter(r)} style={{
                background: filter === r ? (color || t.accent) : "rgba(255,255,255,0.04)",
                border: `1px solid ${color ? color + "33" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 7, padding: "4px 11px",
                color: filter === r ? "#111" : t.textSub,
                fontSize: "0.7em", fontWeight: 700,
                cursor: "pointer", fontFamily: "DM Sans,sans-serif",
                letterSpacing: "0.05em", transition: "all 0.15s",
              }}>{r}</button>
            );
          })}
        </div>
        {loading ? <LoadingSpinner accent={t.accent} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
            {filtered.map(b => (
              <BrawlerCardClickable key={b.id} brawler={b} theme={t} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BrawlerDetailModal
          brawler={selected}
          theme={t}
          onClose={() => setSelected(null)}
        />
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
