import { useState, useEffect } from "react";

// ── ASSETS ────────────────────────────────────────────────────────────────────
const LOGO = "/BlusClues_Logo.webp";

export const OWLS = {
  idle:    "/Owl_01.webp",
  win:     "/Owl_24.webp",
  fail:    "/Owl_29.webp",
  hint:    "/Owl_16.webp",
  blocked: "/Owl_11.webp",
  loading: "/Owl_08.webp",
};

// ── CATEGORY REGISTRY ─────────────────────────────────────────────────────────
// logo: null = placeholder color card. Swap in real logo path when ready.
const CATEGORIES = [
  {
    id: "action",
    name: "Action",
    description: "Slide, untangle, and maneuver your way to victory.",
    color: "#7bed9f",
    glow:  "#7bed9f",
    logo:  null,
    games: [
      { id: "snake-escape", name: "Snake Escape", available: true },
      { id: "bumper-cars",  name: "Bumper Cars",  available: false },
      { id: "tangled",      name: "Tangled",       available: false },
    ],
  },
  {
    id: "word",
    name: "Word",
    description: "Letters, clues, and the perfect word.",
    color: "#ffd93d",
    glow:  "#ffd93d",
    logo:  null,
    games: [
      { id: "hoot-and-holler", name: "Hoot & Holler", available: false },
      { id: "anagrams",        name: "Anagrams",       available: false },
      { id: "word-search",     name: "Word Search",    available: false },
      { id: "crossword",       name: "Crossword",      available: false },
      { id: "crack-the-case",  name: "Crack the Case", available: false },
    ],
  },
  {
    id: "number",
    name: "Number",
    description: "Grids, logic, and satisfying precision.",
    color: "#4ecdc4",
    glow:  "#4ecdc4",
    logo:  null,
    games: [
      { id: "sudoku",  name: "Sudoku",  available: false },
      { id: "picross", name: "Picross", available: false },
    ],
  },
  {
    id: "trivia",
    name: "Trivia",
    description: "How much do you actually know?",
    color: "#a29bfe",
    glow:  "#a29bfe",
    logo:  null,
    games: [
      { id: "trivia-science",    name: "Science",    available: false },
      { id: "trivia-history",    name: "History",    available: false },
      { id: "trivia-pop",        name: "Pop Culture", available: false },
      { id: "trivia-geography",  name: "Geography",  available: false },
      { id: "trivia-sports",     name: "Sports",     available: false },
      { id: "trivia-gaming",     name: "Gaming",     available: false },
    ],
  },
];

const RAINBOW = ["#ff6b6b","#ff9f43","#ffd93d","#7bed9f","#4ecdc4","#4a9eff","#a29bfe","#fd79a8"];

// ── SPARKLE ───────────────────────────────────────────────────────────────────
function Sparkle({ x, y, color, size, delay }) {
  return (
    <div style={{ position:"absolute", left:x, top:y, width:size, height:size, opacity:0,
      animation:`sparkle 2.4s ease-in-out ${delay}s infinite`, pointerEvents:"none" }}>
      <svg viewBox="0 0 20 20" width={size} height={size}>
        <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" fill={color}/>
      </svg>
    </div>
  );
}

// ── CATEGORY CARD ─────────────────────────────────────────────────────────────
function CategoryCard({ category, onOpen, index, loaded }) {
  const [hovered, setHovered] = useState(false);
  const hasAvailable = category.games.some(g => g.available);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(category.id)}
      style={{
        position: "relative",
        background: hovered
          ? `linear-gradient(135deg, #0d1535 0%, #111830 100%)`
          : `linear-gradient(135deg, #090d1f 0%, #0d1228 100%)`,
        border: `1.5px solid ${hovered ? category.color : "#1a2040"}`,
        borderRadius: 20,
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? `0 12px 40px ${category.glow}33, 0 0 0 1px ${category.color}22`
          : "0 2px 12px rgba(0,0,0,0.4)",
        overflow: "hidden",
        opacity: loaded ? 1 : 0,
        animation: loaded ? `slideUp 0.5s ease ${0.25 + index * 0.1}s both` : "none",
      }}
    >
      {/* Glow blob */}
      <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100,
        borderRadius:"50%", background:category.color,
        opacity:hovered?0.15:0.05, filter:"blur(24px)",
        transition:"opacity 0.3s", pointerEvents:"none" }}/>

      <div style={{ display:"flex", alignItems:"center", gap:16 }}>

        {/* Color badge / future logo */}
        <div style={{
          width: 60, height: 60, borderRadius: 16, flexShrink: 0,
          background: `linear-gradient(135deg, ${category.color}33, ${category.color}11)`,
          border: `2px solid ${category.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {category.logo
            ? <img src={category.logo} alt={category.name}
                style={{ width:52, height:52, objectFit:"contain" }}/>
            : <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13,
                color:category.color, textAlign:"center", lineHeight:1.2, padding:4 }}>
                {category.name}
              </div>
          }
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#e8eaf6",
            fontFamily:"'Fredoka One',cursive", letterSpacing:0.3, marginBottom:4 }}>
            {category.name}
          </div>
          <div style={{ fontSize:12, color:"#4a5580", fontFamily:"'Nunito',sans-serif",
            lineHeight:1.4, marginBottom:8 }}>
            {category.description}
          </div>
          {/* Game pills */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {category.games.map(g => (
              <div key={g.id} style={{
                fontSize:10, padding:"2px 8px", borderRadius:8, fontFamily:"'Nunito',sans-serif",
                background: g.available ? `${category.color}22` : "#0a0d1a",
                color: g.available ? category.color : "#2a3060",
                border: `1px solid ${g.available ? category.color+"44" : "#1a2040"}`,
              }}>{g.name}</div>
            ))}
          </div>
        </div>

        <div style={{ flexShrink:0 }}>
          <div style={{
            background: hasAvailable
              ? `linear-gradient(135deg, ${category.color}, ${category.color}bb)`
              : "#1a2040",
            borderRadius: 10, padding: "8px 14px",
            fontSize: 12, fontWeight: 700,
            color: hasAvailable ? "#0d1020" : "#2a3060",
            fontFamily: "'Nunito',sans-serif",
            opacity: hovered ? 1 : 0.85,
            transition: "opacity 0.2s",
          }}>{hasAvailable ? "Play" : "Soon"}</div>
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [sfx, setSfx] = useState(true);
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(8px)" }}
      onClick={onClose}>
      <div style={{ background:"linear-gradient(160deg,#0d1535,#090d1f)", border:"1px solid #1a2550",
        borderRadius:24, padding:28, minWidth:280,
        animation:"popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:22, color:"#e8eaf6", marginBottom:24 }}>⚙️ Settings</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ color:"#c8cfe0", fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:700 }}>Sound Effects</div>
            <div style={{ color:"#4a5580", fontFamily:"'Nunito',sans-serif", fontSize:12 }}>Tap sounds and feedback</div>
          </div>
          <div onClick={() => setSfx(s => !s)} style={{ width:48, height:26, borderRadius:13,
            background:sfx?"#4ecdc4":"#1a2040", position:"relative", cursor:"pointer", transition:"background 0.2s" }}>
            <div style={{ position:"absolute", top:3, left:sfx?25:3, width:20, height:20,
              borderRadius:"50%", background:"#fff", transition:"left 0.2s",
              boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }}/>
          </div>
        </div>
        <div style={{ background:"#0a0d1a", borderRadius:12, padding:"12px 16px",
          fontFamily:"'Nunito',sans-serif", fontSize:12, color:"#2a3060", marginBottom:20 }}>
          🔇 No music — ever. You're welcome.
        </div>
        <button onClick={onClose} style={{ width:"100%", background:"linear-gradient(135deg,#4a9eff,#6c63ff)",
          border:"none", borderRadius:14, padding:"12px 0", color:"#fff", fontSize:15, fontWeight:700,
          fontFamily:"'Fredoka One',cursive", cursor:"pointer", letterSpacing:0.5 }}>Done</button>
      </div>
    </div>
  );
}

// ── SHELL ─────────────────────────────────────────────────────────────────────
export default function Shell({ onOpen }) {
  const [showSettings, setShowSettings] = useState(false);
  const [user,         setUser]         = useState(null);
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const sparkles = [
    { x:"8%",  y:"12%", color:"#ffd93d", size:10, delay:0   },
    { x:"88%", y:"8%",  color:"#ff6b6b", size:8,  delay:0.6 },
    { x:"92%", y:"30%", color:"#4ecdc4", size:12, delay:1.1 },
    { x:"5%",  y:"45%", color:"#a29bfe", size:9,  delay:0.3 },
    { x:"95%", y:"60%", color:"#fd79a8", size:11, delay:1.8 },
    { x:"12%", y:"75%", color:"#7bed9f", size:8,  delay:0.9 },
    { x:"80%", y:"82%", color:"#ffd93d", size:10, delay:1.4 },
    { x:"50%", y:"5%",  color:"#4a9eff", size:7,  delay:2.1 },
  ];

  return (
    <div style={{ minHeight:"100vh",
      background:"radial-gradient(ellipse at 20% 20%,#0d1535 0%,#060810 60%,#020408 100%)",
      display:"flex", flexDirection:"column", alignItems:"center",
      fontFamily:"'Nunito',sans-serif", position:"relative", overflow:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes sparkle    { 0%,100%{opacity:0;transform:scale(0.5) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
        @keyframes popIn      { from{opacity:0;transform:scale(0.8) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rainbowShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes owlBob     { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
      `}</style>

      {sparkles.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Star field */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {Array.from({ length:40 }).map((_, i) => (
          <div key={i} style={{ position:"absolute",
            left:`${(i*37+11)%100}%`, top:`${(i*53+7)%100}%`,
            width:i%3===0?2:1, height:i%3===0?2:1,
            borderRadius:"50%", background:"#fff", opacity:0.1+(i%5)*0.04 }}/>
        ))}
      </div>

      {/* Header */}
      <div style={{ width:"100%", maxWidth:480, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"16px 20px", boxSizing:"border-box",
        opacity:loaded?1:0, transition:"opacity 0.5s" }}>
        <div style={{ width:36 }}/>
        <div style={{ fontFamily:"'Fredoka One',cursive", fontSize:13, letterSpacing:2,
          background:`linear-gradient(90deg,${RAINBOW.join(",")})`, backgroundSize:"300% 300%",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"rainbowShift 6s ease infinite", textTransform:"uppercase" }}>Puzzle Collection</div>
        <button onClick={() => setShowSettings(true)} style={{ background:"none",
          border:"1px solid #1a2040", borderRadius:10, padding:"6px 10px",
          color:"#4a5580", fontSize:16, cursor:"pointer" }}>⚙️</button>
      </div>

      {/* Logo */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0 20px 4px",
        opacity:loaded?1:0, animation:loaded?"slideUp 0.6s ease 0.1s both":"none" }}>
        <img src={LOGO} alt="Blu's Clues" style={{ width:240, height:240, objectFit:"contain",
          animation:"owlBob 4s ease-in-out infinite", filter:"drop-shadow(0 0 24px #4a9eff33)" }}/>
        <div style={{ height:3, width:120, borderRadius:2, marginTop:4,
          background:`linear-gradient(90deg,${RAINBOW.join(",")})`, backgroundSize:"200% 100%",
          animation:"rainbowShift 4s linear infinite" }}/>
      </div>

      {/* Login */}
      <div style={{ padding:"12px 20px 4px", opacity:loaded?1:0,
        animation:loaded?"slideUp 0.6s ease 0.2s both":"none" }}>
        {user ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0d1228",
            border:"1px solid #1a2040", borderRadius:20, padding:"6px 14px" }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:"#4ecdc4",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:700, color:"#0d1020" }}>{user.name[0]}</div>
            <span style={{ color:"#c8cfe0", fontSize:13 }}>{user.name}</span>
            <button onClick={() => setUser(null)}
              style={{ background:"none", border:"none", color:"#2a3060", fontSize:11, cursor:"pointer" }}>
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => setUser({ name:"Blu" })} style={{
            background:"linear-gradient(135deg,#1a2040,#141828)", border:"1px solid #1e2850",
            borderRadius:20, padding:"8px 18px", display:"flex", alignItems:"center", gap:8,
            cursor:"pointer", color:"#c8cfe0", fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:600 }}>
            <span style={{ fontSize:16 }}>🔑</span> Sign in with Google
          </button>
        )}
      </div>

      {/* Category cards */}
      <div style={{ width:"100%", maxWidth:480, padding:"12px 16px 48px",
        boxSizing:"border-box", display:"flex", flexDirection:"column", gap:12 }}>
        {CATEGORIES.map((cat, i) => (
          <CategoryCard key={cat.id} category={cat} onOpen={onOpen} index={i} loaded={loaded} />
        ))}
      </div>

      {/* Footer rainbow */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg,${RAINBOW.join(",")})`, backgroundSize:"200% 100%",
        animation:"rainbowShift 4s linear infinite" }}/>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)}/>}
    </div>
  );
}
