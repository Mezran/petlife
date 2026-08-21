import { createFileRoute, Link } from "@tanstack/react-router";

// placeholder — the real form (Base UI inputs + the BetterAuth client)
// lands in 6.4
const LoginPage = () => (
  <section className="max-w-md rounded-xl border border-brand-200 bg-white p-gutter shadow-sm">
    <h2 className="text-display mb-2">Log in</h2>
    <p className="text-sm">
      The login form arrives with auth wiring in 6.4. No account yet?{" "}
      <Link
        className="font-medium text-brand-700 hover:text-brand-600"
        to="/register"
      >
        Register
      </Link>
    </p>
  </section>
);

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
