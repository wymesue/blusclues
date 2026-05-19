import { useState, useEffect, useRef } from "react";
import {
  DV, DK,
  simulateExit, getPreview,
  nextBody, isOffBoard, visibleCells
} from "../arrow-logic.js";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const THEMES = {
  dark:     { bg:"#0d1020", surface:"#141828", snake:"#c8cfe0", sel:"#4a9eff", bad:"#ff3b3b", text:"#fff", sub:"#4a5070", border:"#1e2438", dot:"#2a3050" },
  light:    { bg:"#f0ebe0", surface:"#e5dfd4", snake:"#1a1a2e", sel:"#2563eb", bad:"#dc2626", text:"#1a1a1a", sub:"#999", border:"#ccc", dot:"#a0a8c0" },
  colorful: { bg:"#0a0a18", surface:"#111128", snake:null,      sel:"#fff",    bad:"#ff3b3b", text:"#fff", sub:"#4a4a6a", border:"#1a1a38", dot:"#1e1e3a" },
};
const COLORS = ["#ff6b6b","#4ecdc4","#ffd93d","#ff8cc8","#a8e6cf","#c3a6ff","#7bed9f","#ffb347","#45b7d1","#fd79a8","#a29bfe","#55efc4"];

// ── SHAPE RASTERIZER ──────────────────────────────────────────────────────────
function rasterizeShape(svgPath, viewBox, cols, rows) {
  const active = new Set();
  try {
    const canvas = document.createElement("canvas");
    const W = cols * 4, H = rows * 4;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const [,, vW, vH] = viewBox.split(" ").map(Number);
    ctx.scale(W / vW, H / vH);
    ctx.fillStyle = "#fff";
    ctx.fill(new Path2D(svgPath));
    const img = ctx.getImageData(0, 0, W, H);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = Math.floor((col + 0.5) * 4);
        const py = Math.floor((row + 0.5) * 4);
        const idx = (py * W + px) * 4;
        if (img.data[idx] > 128) active.add(`${col},${row}`);
      }
    }
  } catch (e) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        active.add(`${c},${r}`);
  }
  return active;
}

// ── GAME ──────────────────────────────────────────────────────────────────────
export default function ArrowGame({ levelData, onComplete, onQuit }) {
  // levelData: array of level objects from levels.json
  // onComplete(levelId): called when player finishes a level
  // onQuit(): called when player exits back to app shell

  const [themeKey,  setThemeKey]  = useState("dark");
  const [colorSec,  setColorSec]  = useState(0);
  const [lvlIdx,    setLvlIdx]    = useState(0);
  const [snakes,    setSnakes]    = useState([]);
  const [activeCells, setActiveCells] = useState(null);
  const [sel,       setSel]       = useState(null);
  const [lives,     setLives]     = useState(3);
  const [shake,     setShake]     = useState(false);
  const [flashId,   setFlashId]   = useState(null);
  const [won,       setWon]       = useState(false);
  const [over,      setOver]      = useState(false);
  const [showTh,    setShowTh]    = useState(false);
  const [showAd,    setShowAd]    = useState(false);
  const [adType,    setAdType]    = useState(null);
  const [hintSec,   setHintSec]   = useState(0);
  const [anims,     setAnims]     = useState([]);

  const colorRef = useRef(null);
  const hintRef  = useRef(null);

  const level   = levelData[lvlIdx];
  const theme   = THEMES[themeKey];
  const colored = themeKey === "colorful";
  const sc      = id => colored ? COLORS[id % COLORS.length] : theme.snake;

  const W    = Math.min(window.innerWidth, 500);
  const CELL = Math.min(Math.floor((W - 16) / level.cols), Math.floor(window.innerHeight * 0.72 / level.rows), 38);
  const gW   = CELL * level.cols;
  const gH   = CELL * level.rows;
  const sw   = 2.5;

  // Load level
  useEffect(() => {
    const l = levelData[lvlIdx];
    setAnims([]);
    setSel(null);
    setLives(3);
    setWon(false);
    setOver(false);
    setFlashId(null);
    setHintSec(0);

    if (l.isShape && l.shapeData) {
      const cells = rasterizeShape(l.shapeData.path, l.shapeData.viewBox, l.cols, l.rows);
      setActiveCells(cells);
    } else {
      setActiveCells(null);
    }

    setSnakes(JSON.parse(JSON.stringify(l.snakes)));
  }, [lvlIdx]);

  // Colorful timer
  useEffect(() => {
    clearInterval(colorRef.current);
    if (colorSec > 0) colorRef.current = setInterval(() =>
      setColorSec(s => { if (s <= 1) { clearInterval(colorRef.current); setThemeKey("dark"); return 0; } return s - 1; }), 1000);
    return () => clearInterval(colorRef.current);
  }, [colorSec]);

  // Hint timer
  useEffect(() => {
    clearInterval(hintRef.current);
    if (hintSec > 0) hintRef.current = setInterval(() =>
      setHintSec(s => { if (s <= 1) { clearInterval(hintRef.current); return 0; } return s - 1; }), 1000);
    return () => clearInterval(hintRef.current);
  }, [hintSec]);

  // Animation loop
  useEffect(() => {
    if (anims.length === 0) return;
    const timer = setInterval(() => {
      setAnims(prev => {
        const done = [];
        const next = prev.map(a => {
          const newBody = nextBody(a.body, a.dir);
          const vis = visibleCells(newBody, level.cols, level.rows);
          if (vis.length === 0) { done.push(a.id); return a; }
          return { ...a, body: newBody };
        });
        if (done.length) {
          setSnakes(s => {
            const ns = s.filter(sn => !done.includes(sn.id));
            if (!ns.length) {
              setWon(true);
              onComplete?.(level.id);
            }
            return ns;
          });
          return next.filter(a => !done.includes(a.id));
        }
        return next;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [anims.length, level.cols, level.rows]);

  const freeIds = new Set(
    hintSec > 0
      ? snakes.filter(s => !anims.some(a => a.id === s.id) && simulateExit(s, snakes, level.cols, level.rows, activeCells)).map(s => s.id)
      : []
  );

  const reset = idx => {
    setLvlIdx(Math.max(0, Math.min(idx, levelData.length - 1)));
  };

  const tap = id => {
    if (won || over || anims.find(a => a.id === id)) return;
    const snake = snakes.find(s => s.id === id);
    if (!snake) return;

    if (sel?.id === id) {
      if (!simulateExit(snake, snakes, level.cols, level.rows, activeCells)) {
        setFlashId(id); setTimeout(() => setFlashId(null), 600);
        setShake(true); setTimeout(() => setShake(false), 450);
        setSel(null);
        const nl = lives - 1; setLives(nl);
        if (nl <= 0) setTimeout(() => setOver(true), 650);
      } else {
        const body = snake.cells.map(c => [c.x, c.y]);
        setAnims(prev => [...prev, { id, body, dir: snake.dir }]);
        setSnakes(prev => prev.filter(s => s.id !== id));
        setSel(null);
      }
    } else {
      setSel({ id, path: getPreview(snake, snakes, level.cols, level.rows, activeCells) });
    }
  };

  const watchAd = () => {
    setShowAd(false);
    if (adType === "lives") { setLives(3); setOver(false); }
    if (adType === "hint")  { setHintSec(10); return; }
    setColorSec(600); setThemeKey("colorful");
  };

  const selBlocked = sel && sel.path === null;

  const renderSnake = (cells, color, dir, isSel, isRed, onClick) => {
    const c = isRed ? theme.bad : isSel ? theme.sel : color;
    const pxCells = cells.map(cl => ({ x: cl[0] * CELL + CELL / 2, y: cl[1] * CELL + CELL / 2 }));
    const pts = pxCells.map(p => `${p.x},${p.y}`);
    const d = pts.length > 1 ? `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(" ")}` : "";
    const hx = pxCells[0].x, hy = pxCells[0].y;
    const half = CELL * 0.5, wing = CELL * 0.18;
    const arr = {
      R: { tx: hx+half, ty: hy,     w1x: hx+half-wing*1.2, w1y: hy-wing, w2x: hx+half-wing*1.2, w2y: hy+wing },
      L: { tx: hx-half, ty: hy,     w1x: hx-half+wing*1.2, w1y: hy-wing, w2x: hx-half+wing*1.2, w2y: hy+wing },
      D: { tx: hx,      ty: hy+half, w1x: hx-wing, w1y: hy+half-wing*1.2, w2x: hx+wing, w2y: hy+half-wing*1.2 },
      U: { tx: hx,      ty: hy-half, w1x: hx-wing, w1y: hy-half+wing*1.2, w2x: hx+wing, w2y: hy-half+wing*1.2 },
    }[dir];

    return (
      <g onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
        {d && <path d={d} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
        <line x1={hx} y1={hy} x2={arr.tx} y2={arr.ty} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <line x1={arr.w1x} y1={arr.w1y} x2={arr.tx} y2={arr.ty} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        <line x1={arr.w2x} y1={arr.w2y} x2={arr.tx} y2={arr.ty} stroke={c} strokeWidth={sw} strokeLinecap="round" />
        {isSel && <circle cx={hx} cy={hy} r={CELL * 0.26} fill="none" stroke={c} strokeWidth={1.5} opacity={0.5}
          style={{ animation: "ring 0.9s ease infinite" }} />}
      </g>
    );
  };

  return (
    <div style={{ height: "100vh", background: theme.bg, display: "flex", flexDirection: "column",
      alignItems: "center", overflow: "hidden", userSelect: "none", WebkitUserSelect: "none",
      fontFamily: "Georgia,serif", transition: "background 0.3s" }}>

      <style>{`
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes popIn  { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
        @keyframes glow   { 0%,100%{opacity:0.5} 50%{opacity:0.1} }
        @keyframes ring   { 0%,100%{opacity:0.6} 50%{opacity:0.15} }
        @keyframes flash  { 0%,100%{opacity:1} 50%{opacity:0.1} }
      `}</style>

      {/* Header */}
      <div style={{ width: "100%", background: theme.surface, borderBottom: `1px solid ${theme.border}`,
        padding: "9px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <button onClick={onQuit} style={{ background: "none", border: "none", color: theme.sub, fontSize: 18, cursor: "pointer" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: theme.text, fontSize: 12, fontWeight: "bold" }}>Level {level.id}</div>
          <div style={{ color: theme.sub, fontSize: 10 }}>{level.label} · {snakes.length} left</div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => { setAdType("hint"); setShowAd(true); }}
            style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7,
              padding: "3px 7px", color: hintSec > 0 ? "#ffd93d" : theme.sub, fontSize: 11, cursor: "pointer" }}>
            💡{hintSec > 0 ? ` ${hintSec}s` : ""}
          </button>
          <button onClick={() => setShowTh(true)}
            style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7,
              padding: "3px 7px", color: theme.sub, fontSize: 11, cursor: "pointer" }}>🎨</button>
        </div>
      </div>

      {/* Hearts + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "4px 14px", flexShrink: 0, boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[0, 1, 2].map(i => <span key={i} style={{ fontSize: 17, opacity: i < lives ? 1 : 0.1, transition: "opacity 0.3s" }}>❤️</span>)}
          {colored && colorSec > 0 && <span style={{ color: theme.sub, fontSize: 10 }}>🎨 {Math.floor(colorSec / 60)}:{String(colorSec % 60).padStart(2, "0")}</span>}
        </div>
        <div style={{ color: theme.sub, fontSize: 11 }}>
          {sel ? selBlocked ? "⛔ Blocked" : "Tap again →" : hintSec > 0 ? `💡 ${hintSec}s` : "Tap a snake"}
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => reset(lvlIdx)}
            style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7,
              padding: "3px 7px", color: theme.text, fontSize: 11, cursor: "pointer" }}>↺</button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        animation: shake ? "shake 0.45s ease" : "none" }}>
        <svg width={gW} height={gH} style={{ display: "block", touchAction: "none" }}>

          {activeCells && Array.from({ length: level.rows }, (_, r) =>
            Array.from({ length: level.cols }, (_, c) => {
              if (activeCells.has(`${c},${r}`)) return null;
              return <rect key={`m${c}-${r}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                fill={theme.bg} opacity={0.85} />;
            })
          )}

          {Array.from({ length: level.rows }, (_, r) =>
            Array.from({ length: level.cols }, (_, c) => {
              if (activeCells && !activeCells.has(`${c},${r}`)) return null;
              return <circle key={`${c}-${r}`} cx={c * CELL + CELL / 2} cy={r * CELL + CELL / 2} r={1.5} fill={theme.dot} />;
            })
          )}

          {(sel?.path || []).map((p, i) => (
            <rect key={i} x={p.x * CELL + 1} y={p.y * CELL + 1} width={CELL - 2} height={CELL - 2} rx={2}
              fill={selBlocked ? theme.bad : theme.sel} opacity={0.2} />
          ))}

          {snakes.map(sn => {
            const isSel  = sel?.id === sn.id;
            const isRed  = flashId === sn.id;
            const isFree = freeIds.has(sn.id);
            const c = isRed ? theme.bad : isSel ? theme.sel : sc(sn.id);
            const cells = sn.cells.map(cl => [cl.x, cl.y]);
            return (
              <g key={sn.id}>
                {isFree && (() => {
                  const pts = cells.map(cl => `${cl[0] * CELL + CELL / 2},${cl[1] * CELL + CELL / 2}`);
                  const d = pts.length > 1 ? `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(" ")}` : "";
                  return d && <path d={d} fill="none" stroke={c} strokeWidth={sw + 6}
                    strokeLinecap="round" strokeLinejoin="round" opacity={0.3}
                    style={{ animation: "glow 1.4s ease infinite" }} />;
                })()}
                {renderSnake(cells, sc(sn.id), sn.dir, isSel, isRed, () => tap(sn.id))}
              </g>
            );
          })}

          {anims.map(anim => {
            const vis = visibleCells(anim.body, level.cols, level.rows);
            if (!vis.length) return null;
            return (
              <g key={`a${anim.id}`}>
                {renderSnake(vis, sc(anim.id), anim.dir, false, false, null)}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Level nav */}
      <div style={{ display: "flex", gap: 8, padding: "6px 10px", justifyContent: "center",
        alignItems: "center", flexShrink: 0, background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
        <button onClick={() => lvlIdx > 0 && reset(lvlIdx - 1)}
          style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7,
            padding: "3px 10px", color: lvlIdx > 0 ? theme.text : theme.border, fontSize: 12, cursor: "pointer" }}>←</button>
        <span style={{ color: theme.sub, fontSize: 11, minWidth: 100, textAlign: "center" }}>
          Level {level.id} · {level.label}
        </span>
        <button onClick={() => lvlIdx < levelData.length - 1 && reset(lvlIdx + 1)}
          style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 7,
            padding: "3px 10px", color: theme.text, fontSize: 12, cursor: "pointer" }}>→</button>
      </div>

      {/* WIN */}
      {won && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ fontSize: 56, animation: "popIn .4s ease" }}>🎉</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: "bold", marginTop: 14 }}>Cleared!</div>
          <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>Level {level.id} done</div>
          {lvlIdx < levelData.length - 1 ? (
            <button onClick={() => reset(lvlIdx + 1)}
              style={{ marginTop: 28, background: "#4a9eff", border: "none", borderRadius: 14,
                padding: "14px 36px", color: "#fff", fontSize: 17, cursor: "pointer", fontWeight: "bold" }}>
              Next Level →
            </button>
          ) : (
            <div style={{ color: "#fff", fontSize: 16, marginTop: 28 }}>All levels complete! 🔵</div>
          )}
        </div>
      )}

      {/* GAME OVER */}
      {over && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ fontSize: 52 }}>💔</div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 14 }}>Out of Hearts</div>
          <button onClick={() => reset(lvlIdx)}
            style={{ marginTop: 22, background: "#ff4757", border: "none", borderRadius: 14,
              padding: "12px 30px", color: "#fff", fontSize: 16, cursor: "pointer", fontWeight: "bold" }}>
            ↺ Restart Level
          </button>
          <button onClick={() => { setAdType("lives"); setShowAd(true); }}
            style={{ marginTop: 12, background: "none", border: "1px solid #444", borderRadius: 14,
              padding: "11px 26px", color: "#aaa", fontSize: 14, cursor: "pointer" }}>
            📺 Watch Ad · Continue
          </button>
        </div>
      )}

      {/* THEME */}
      {showTh && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowTh(false)}>
          <div style={{ background: theme.surface, borderRadius: 20, padding: 24, minWidth: 248 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ color: theme.text, fontSize: 17, fontWeight: "bold", marginBottom: 16 }}>Theme</div>
            {["dark", "light"].map(k => (
              <button key={k} onClick={() => { setThemeKey(k); setShowTh(false); }}
                style={{ display: "block", width: "100%", marginBottom: 10, padding: "11px 14px",
                  borderRadius: 12, background: themeKey === k ? theme.sel : theme.border, border: "none",
                  color: themeKey === k ? "#fff" : theme.text, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
                {k === "dark" ? "🌑 Dark" : "☀️ Light"}
              </button>
            ))}
            <button onClick={() => { setShowTh(false); setAdType("colorful"); setShowAd(true); }}
              style={{ display: "block", width: "100%", padding: "11px 14px", borderRadius: 12,
                background: colored ? "#a855f7" : theme.border, border: "none",
                color: colored ? "#fff" : theme.text, fontSize: 14, cursor: "pointer", textAlign: "left" }}>
              🎨 Colorful {colored ? `(${Math.floor(colorSec / 60)}:${String(colorSec % 60).padStart(2, "0")} left)` : "(Watch Ad)"}
            </button>
          </div>
        </div>
      )}

      {/* AD */}
      {showAd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1a1a2e", borderRadius: 20, padding: 26, maxWidth: 280, textAlign: "center" }}>
            <div style={{ fontSize: 38 }}>📺</div>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 12 }}>
              {adType === "hint" ? "Get a Hint" : adType === "lives" ? "Continue Playing" : "Unlock Colorful"}
            </div>
            <div style={{ color: "#aaa", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
              {adType === "hint" ? "Watch a short ad to highlight moveable snakes for 10 seconds."
                : adType === "lives" ? "Watch a short ad to refill your hearts."
                : "Watch a short ad for 10 minutes of Colorful mode."}
            </div>
            <button onClick={watchAd}
              style={{ marginTop: 18, background: "#4a9eff", border: "none", borderRadius: 14,
                padding: "12px 0", color: "#fff", fontSize: 16, cursor: "pointer", fontWeight: "bold", width: "100%" }}>
              ▶ Watch Ad
            </button>
            <button onClick={() => setShowAd(false)}
              style={{ marginTop: 10, background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
