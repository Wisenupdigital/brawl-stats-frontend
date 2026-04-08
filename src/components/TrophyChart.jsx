import { useState, useEffect, useRef } from "react";
import { API_BASE, generateEstimatedHistory } from "../utils/constants";

export default function TrophyChart({ trophies, highestTrophies, playerTag, realHistory, accent, mode = "week" }) {
  const [progress, setProgress] = useState(0);
  const [realData, setRealData] = useState(null);
  const rafRef = useRef(null);
  const dataRef = useRef([]);

  useEffect(() => {
    if (!playerTag) return;
    const clean = playerTag.replace(/^#/, "");
    fetch(`${API_BASE}/players/%23${clean}/history?days=90`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.history?.length >= 2) {
          setRealData(d.history);
        } else {
          setRealData(null);
        }
      })
      .catch(() => setRealData(null));
  }, [playerTag]);

  useEffect(() => {
    const raw = realData
      ? realData.map(p => p.trophies)
      : generateEstimatedHistory(trophies, highestTrophies);
    dataRef.current = raw;
    setProgress(0);
    let start = null;
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min(1, ease((ts - start) / 1500));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [trophies, highestTrophies, realData]);

  const data = dataRef.current;
  if (!data || data.length < 2) return null;

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

  const areaD = pathD + ` L${toX(visible-1)},${PAD.top+iH} L${toX(0)},${PAD.top+iH} Z`;
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? "#f5a623" : "#e85555";

  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const yTicks = [minV, (minV + maxV) / 2, maxV];

  const xLabels = realData
    ? realData.map(p => {
        const d = new Date(p.period);
        return `${d.getDate()} ${months[d.getMonth()]}`;
      })
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {realData && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4caf75" }} />
          <span style={{ color: "#4caf75", fontSize: "0.65em", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            Historique réel · {realData.length} jours
          </span>
        </div>
      )}
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

        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 7} y={toY(v) + 4} textAnchor="end" fill="#333" fontSize="9.5" fontFamily="'DM Sans', sans-serif">
              {v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v)}
            </text>
          </g>
        ))}

        {data.map((_, i) => {
          if (i % Math.ceil(data.length / 4) !== 0 && i !== data.length - 1) return null;
          const label = xLabels ? xLabels[i] : `J${i+1}`;
          return (
            <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#2e2e2e" fontSize="9.5" fontFamily="'DM Sans', sans-serif">
              {label}
            </text>
          );
        })}

        {vd.length > 1 && <path d={areaD} fill="url(#chartArea)" />}
        {vd.length > 1 && (
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        )}

        {(() => {
          const peakVal = Math.max(...vd);
          const peakI = vd.indexOf(peakVal);
          if (peakI < 0 || peakI === vd.length - 1) return null;
          return (
            <g>
              <circle cx={toX(peakI)} cy={toY(peakVal)} r={4} fill="#f5a623" stroke="#0d0f14" strokeWidth="2" />
              <text x={toX(peakI)} y={toY(peakVal) - 9} textAnchor="middle" fill="#f5a623" fontSize="9" fontWeight="700" fontFamily="'DM Sans', sans-serif">
                ▲ {peakVal.toLocaleString()}
              </text>
            </g>
          );
        })()}

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
    </div>
  );
}
