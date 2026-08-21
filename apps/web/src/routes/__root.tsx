import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import type { AuthState } from "../auth.ts";

// the router context: every route's beforeLoad (and later, loaders) can read this.
interface RouterContext {
  auth: AuthState;
}

// ---------------------------------------------------------------------------
// not found — any URL no route matches lands here (the real 404 of the SPA)
// ---------------------------------------------------------------------------

const NotFound = () => (
  <section className="max-w-md rounded-xl border border-brand-200 bg-white p-gutter shadow-sm">
    <h2 className="text-display mb-2">Page not found</h2>
    <p className="mb-4 text-sm">Nothing lives at this address.</p>
    <Link className="font-medium text-brand-700 hover:text-brand-600" to="/">
      Back to home
    </Link>
  </section>
);

// ---------------------------------------------------------------------------
// root layout — shell, now wrapping every route through <Outlet />
// ---------------------------------------------------------------------------

const RootLayout = () => (
  <div className="min-h-dvh bg-brand-50 text-brand-950">
    <header className="border-b border-brand-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-gutter py-4">
        <h1 className="text-display text-brand-700">
          <Link to="/">PetLife</Link>
        </h1>
        <nav aria-label="Main">
          <ul className="flex items-center gap-gutter font-medium">
            <li>
              <Link
                className="hover:text-brand-600"
                activeProps={{ className: "text-brand-600" }}
                to="/pets"
              >
                Pets
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-brand-600"
                activeProps={{ className: "text-brand-600" }}
                to="/login"
              >
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-5xl p-gutter">
      <Outlet />
    </main>

    {/* renders only in dev — the component hides itself in production builds */}
    <TanStackRouterDevtools position="bottom-right" />
  </div>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});
