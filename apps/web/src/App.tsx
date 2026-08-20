import { Button } from "@base-ui/react/button";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// api status card — proves the dev proxy end to end (6.1's Done-when).
// Plain fetch on purpose: TanStack Query takes over server state in 6.3,
// and this card is the before-picture it will replace.
// ---------------------------------------------------------------------------

type PingState =
  | { phase: "checking" }
  | { phase: "ok"; body: string }
  | { phase: "failed"; detail: string };

// pure helper: fetches and reports, no state of its own — the caller decides
// what to do with the result (keeps setState out of the effect body, which
// react-hooks/set-state-in-effect forbids)
const fetchPingState = async (): Promise<PingState> => {
  try {
    // relative URL: the dev server proxies /api/* to the Express api
    const res = await fetch("/api/v1/ping");
    const body = await res.text();
    return res.ok
      ? { phase: "ok", body }
      : { phase: "failed", detail: `HTTP ${String(res.status)}` };
  } catch (error) {
    return { phase: "failed", detail: String(error) };
  }
};

const ApiStatusCard = () => {
  const [ping, setPing] = useState<PingState>({ phase: "checking" });

  // check once on mount. StrictMode mounts effects twice in dev — the
  // cancelled flag keeps the unmounted copy from setting state
  useEffect(() => {
    let cancelled = false;
    void fetchPingState().then((next) => {
      if (!cancelled) {
        setPing(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="max-w-md rounded-xl border border-brand-200 bg-white p-gutter shadow-sm">
      <h3 className="mb-2 font-semibold">API connection</h3>
      <p className="mb-4 text-sm">
        {ping.phase === "checking" &&
          "Checking /api/v1/ping through the dev proxy…"}
        {ping.phase === "ok" && `The api answered: ${ping.body}`}
        {ping.phase === "failed" && `The api did not answer: ${ping.detail}`}
      </p>
      <Button
        className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
        disabled={ping.phase === "checking"}
        onClick={() => {
          setPing({ phase: "checking" });
          void fetchPingState().then(setPing);
        }}
      >
        Check again
      </Button>
    </section>
  );
};

// ---------------------------------------------------------------------------
// app shell — header / nav / content (the frame every later topic fills in)
// ---------------------------------------------------------------------------

export const App = () => {
  return (
    <div className="min-h-dvh bg-brand-50 text-brand-950">
      <header className="border-b border-brand-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-gutter py-4">
          <h1 className="text-display text-brand-700">PetLife</h1>
          <nav aria-label="Main">
            {/* placeholders — real routes arrive with TanStack Router in 6.2,
                and the wireframes' account menu with auth in 6.4 */}
            <ul className="flex items-center gap-gutter font-medium">
              <li>
                <a className="hover:text-brand-600" href="/">
                  Pets
                </a>
              </li>
              <li>
                <a className="hover:text-brand-600" href="/">
                  Log in
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-gutter">
        <h2 className="text-display mb-gutter">Welcome</h2>
        <ApiStatusCard />
      </main>
    </div>
  );
};
