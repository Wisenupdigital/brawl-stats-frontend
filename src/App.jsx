import { useState } from "react";
import { THEMES } from "./utils/constants";
import { ThemeSwitcher } from "./components/UI";
import PlayerSearchPage from "./pages/PlayerPage";
import { BrawlersPage, RankingsPage, ClubSearchPage, EventsPage } from "./pages/OtherPages";

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
    { id: "search",   label: "Joueur",   key: "J" },
    { id: "brawlers", label: "Brawlers", key: "B" },
    { id: "rankings", label: "Top",      key: "T" },
    { id: "clubs",    label: "Clubs",    key: "C" },
    { id: "events",   label: "Events",   key: "E" },
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
          {page === "search"   && <PlayerSearchPage theme={theme} savedTag={savedTag} onTagSaved={handleTagSaved} />}
          {page === "brawlers" && <BrawlersPage theme={theme} />}
          {page === "rankings" && <RankingsPage theme={theme} />}
          {page === "clubs"    && <ClubSearchPage theme={theme} />}
          {page === "events"   && <EventsPage theme={theme} />}
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
