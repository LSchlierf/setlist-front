import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import ReactDOM from "react-dom/client";
import App from "./App";
import EditSetlist from "./EditSetlist";
import EditRepertoire from "./EditRepertoire";
import { TooltipProvider } from "./components/ui/tooltip";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <TooltipProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/editSetlist/:id" element={<EditSetlist />} />
        <Route path="/editRepertoire" element={<EditRepertoire />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);
