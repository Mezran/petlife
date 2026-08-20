import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import "../index.css";

// #root is static markup in index.html — if it's missing, fail loudly
const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("index.html has no #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
