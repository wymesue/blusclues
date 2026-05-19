import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Generator from "./games/arrow/generator/index.jsx";

// Temporary: routes just what we have so far.
// Shell and editor will be added as we build them.

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/tools/arrow/generator" element={<Generator />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
