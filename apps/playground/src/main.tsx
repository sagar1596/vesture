import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@vesture/tokens/styles.css";
import "@vesture/theme-retro/styles.css";
import "@vesture/react/styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
