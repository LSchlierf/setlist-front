import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import ReactDOM from "react-dom/client";
import App from "./App";
import EditSetlist from "./EditSetlist";
import EditRepertoire from "./EditRepertoire";
import { TooltipProvider } from "./components/ui/tooltip";
import { StrictMode } from "react";
import storage from "./lib/storage";

const root = document.getElementById("root")!;

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") {
    storage.undo();
    return;
  }
  if (e.ctrlKey && e.key === "y") {
    storage.redo();
    return;
  }
});

ReactDOM.createRoot(root).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/editSetlist/:id" element={<EditSetlist />} />
          <Route path="/editRepertoire" element={<EditRepertoire />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>
);
