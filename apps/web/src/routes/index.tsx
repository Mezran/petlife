import { Button } from "@base-ui/react/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// api status card — moved verbatim from the 6.1 App.tsx. Still plain fetch
// on purpose: TanStack Query takes over server state in 6.3.
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
// landing page — the "/" index route
// ---------------------------------------------------------------------------

const HomePage = () => (
  <>
    <h2 className="text-display mb-gutter">Welcome</h2>
    <ApiStatusCard />
  </>
);

export const Route = createFileRoute("/")({
  component: HomePage,
});
