import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Shell from "./Shell.jsx";

// ── ROOT ──────────────────────────────────────────────────────────────────────
// The shell is the home screen. When a player taps a game, onPlay is called
// with the game id. Add routing to each game here as they get built.

function Root() {
  const [activeGame, setActiveGame] = useState(null);

  const handlePlay = (gameId) => {
    // TODO: route to each game as they get built
    // For now just log so we can see it working
    console.log("Launching game:", gameId);
    setActiveGame(gameId);
  };

  const handleQuit = () => {
    setActiveGame(null);
  };

  // When a game is active, render it here.
  // Each game will be imported and swapped in as they're built.
  if (activeGame) {
    return (
      <div style={{ height: "100vh", background: "#060810", display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 48 }}>🚧</div>
        <div style={{ color: "#4a5580", fontFamily: "sans-serif", fontSize: 14 }}>
          {activeGame} coming soon
        </div>
        <button onClick={handleQuit} style={{
          background: "none", border: "1px solid #1a2040", borderRadius: 10,
          padding: "8px 20px", color: "#c8cfe0", cursor: "pointer", fontSize: 14,
        }}>← Back</button>
      </div>
    );
  }

  return <Shell onPlay={handlePlay} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
