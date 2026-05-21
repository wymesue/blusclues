import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import Shell from "./Shell.jsx";

function Root() {
  const [activeGame, setActiveGame] = useState(null);

  const handlePlay = (gameId) => {
    console.log("Launching:", gameId);
    setActiveGame(gameId);
  };

  const handleQuit = () => setActiveGame(null);

  if (activeGame) {
    return (
      <div style={{ height:"100vh", background:"#060810", display:"flex",
        alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>🚧</div>
        <div style={{ color:"#4a5580", fontFamily:"sans-serif", fontSize:14 }}>{activeGame} coming soon</div>
        <button onClick={handleQuit} style={{ background:"none", border:"1px solid #1a2040",
          borderRadius:10, padding:"8px 20px", color:"#c8cfe0", cursor:"pointer", fontSize:14 }}>← Back</button>
      </div>
    );
  }

  return <Shell onPlay={handlePlay} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode><Root /></StrictMode>
);
