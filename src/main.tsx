import { BrowserRouter, Route, Routes } from "react-router";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = document.getElementById("root")!;

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>
);
