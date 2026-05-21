import { StrictMode, useState, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import Shell from "./Shell.jsx";

// ── LAZY TOOL IMPORTS ─────────────────────────────────────────────────────────
// Tools are only loaded when the URL matches — players never download this code
const SnakeGenerator = lazy(() => import("./games/arrow/generator/index.jsx"));

// ── TOOLS ROUTES ──────────────────────────────────────────────────────────────
// Hidden routes only you know about. Add new tools here as games are built:
// /tools/sudoku/generator
// /tools/sudoku/editor  (owner login required)
// /tools/snake-escape/editor (owner login required)
const TOOL_ROUTES = {
  "/tools/snake-escape/generator": SnakeGenerator,
};

// ── ROOT ──────────────────────────────────────────────────────────────────────
function Root() {
  const [activeGame, setActiveGame] = useState(null);
  const [toolComponent, setToolComponent] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    const Tool = TOOL_ROUTES[path];
    if (Tool) setToolComponent(() => Tool);
  }, []);

  // Render tool if URL matches
  if (toolComponent) {
    const Tool = toolComponent;
    return (
      <Suspense fallback={
        <div style={{ height:"100vh", background:"#0d1020", display:"flex",
          alignItems:"center", justifyContent:"center", color:"#4a5580", fontFamily:"monospace" }}>
          Loading tool…
        </div>
      }>
        <Tool />
      </Suspense>
    );
  }

  const handlePlay = (gameId) => {
    setActiveGame(gameId);
  };

  const handleQuit = () => {
    setActiveGame(null);
  };

  if (activeGame) {
    return (
      <div style={{ height:"100vh", background:"#060810", display:"flex",
        alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>🚧</div>
        <div style={{ color:"#4a5580", fontFamily:"sans-serif", fontSize:14 }}>
          {activeGame} coming soon
        </div>
        <button onClick={handleQuit} style={{ background:"none", border:"1px solid #1a2040",
          borderRadius:10, padding:"8px 20px", color:"#c8cfe0", cursor:"pointer", fontSize:14 }}>
          ← Back
        </button>
      </div>
    );
  }

  return <Shell onPlay={handlePlay} onQuit={handleQuit} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Root /></StrictMode>
);
