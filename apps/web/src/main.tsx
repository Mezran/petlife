import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { authStub } from "./auth.ts";
import { routeTree } from "./routeTree.gen.ts";
import "../index.css";

// the route tree is generated from src/routes/ by the router's Vite plugin;
// createRouter makes it live, and context carries the auth stub every guard
// reads (6.4 swaps in the real session)
const router = createRouter({ routeTree, context: { auth: authStub } });

// register the router's type once — every <Link to="..."> and navigate()
// call in the app is now checked against the real route tree
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// #root is static markup in index.html — if it's missing, fail loudly
const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("index.html has no #root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
