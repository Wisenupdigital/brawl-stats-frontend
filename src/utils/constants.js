export const API_BASE = "https://brawl-stats-backend.onrender.com/api";

export async function apiFetch(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getBrawlerImage(name, id) {
  if (id) return `https://cdn.brawlify.com/brawler/borderless/${id}.png`;
  if (!name) return null;
  return `https://cdn.brawlify.com/brawler/borderless/${name.trim().replace(/\s+/g, "_")}.png`;
}

export function generateEstimatedHistory(currentTrophies, highestTrophies, mode = "week") {
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

export const THEMES = {
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

export const rarityColors = {
  "Common": "#90a4ae",
  "Rare": "#4caf75",
  "Super Rare": "#29b6f6",
  "Epic": "#9c6fde",
  "Mythic": "#e85555",
  "Legendary": "#f5a623",
};

export const rarityGlow = {
  "Common": "0 0 8px rgba(144,164,174,0.3)",
  "Rare": "0 0 10px rgba(76,175,117,0.35)",
  "Super Rare": "0 0 10px rgba(41,182,246,0.35)",
  "Epic": "0 0 12px rgba(156,111,222,0.4)",
  "Mythic": "0 0 12px rgba(232,85,85,0.4)",
  "Legendary": "0 0 20px rgba(245,166,35,0.5), 0 0 40px rgba(245,166,35,0.15)",
};

export const MODE_META = {
  gemGrab:         { label: "Gem Grab",     icon: "💎", color: "#9c6fde" },
  brawlBall:       { label: "Brawl Ball",   icon: "⚽", color: "#29b6f6" },
  heist:           { label: "Heist",        icon: "💰", color: "#e85555" },
  bounty:          { label: "Bounty",       icon: "⭐", color: "#4caf75" },
  siege:           { label: "Siege",        icon: "🤖", color: "#ff8c00" },
  hotZone:         { label: "Hot Zone",     icon: "🔥", color: "#ff6b35" },
  knockout:        { label: "Knockout",     icon: "👊", color: "#e91e63" },
  wipeout:         { label: "Wipeout",      icon: "💥", color: "#f44336" },
  duels:           { label: "Duels",        icon: "🗡️", color: "#f5a623" },
  soloShowdown:    { label: "Solo SD",      icon: "🎯", color: "#4caf75" },
  duoShowdown:     { label: "Duo SD",       icon: "👥", color: "#66bb6a" },
  rankedBrawlBall: { label: "Ranked BB",    icon: "🏆", color: "#29b6f6" },
  rankedGemGrab:   { label: "Ranked GG",    icon: "🏆", color: "#9c6fde" },
  rankedKnockout:  { label: "Ranked KO",    icon: "🏆", color: "#e91e63" },
  rankedHeist:     { label: "Ranked Heist", icon: "🏆", color: "#e85555" },
  unknown:         { label: "Unknown",      icon: "❓", color: "#555" },
};

export function getMeta(mode) {
  return MODE_META[mode] || { label: mode?.replace(/([A-Z])/g, " $1").trim() || "?", icon: "🎮", color: "#666" };
}

export function getResult(battle, playerTag) {
  const rank = battle.battle?.rank;
  if (rank !== undefined) {
    if (rank <= 2) return "victory";
    if (rank <= 4) return "draw";
    return "defeat";
  }
  const result = battle.battle?.result;
  if (result) return result.toLowerCase();
  return "unknown";
}

export function getTrophyDelta(battle) {
  const t = battle.battle?.trophyChange;
  if (t === undefined || t === null) return null;
  return t;
}

export function getPlayerBrawler(battle, playerTag) {
  const clean = playerTag?.replace("#", "");
  const teams = battle.battle?.teams || [];
  for (const team of teams) {
    for (const p of team) {
      if (p.tag?.replace("#", "") === clean) return p.brawler;
    }
  }
  const players = battle.battle?.players || [];
  for (const p of players) {
    if (p.tag?.replace("#", "") === clean) return p.brawler;
  }
  return null;
}

export function getTeams(battle) {
  return battle.battle?.teams || [];
}

export function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
    "$1-$2-$3T$4:$5:$6"
  ));
  if (isNaN(d)) return iso.slice(0, 8);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
