import { createFileRoute, redirect } from "@tanstack/react-router";

// pathless guard layout: the leading underscore means it adds no URL segment —
// it exists to wrap children (/pets today, more later) with one beforeLoad.
// If beforeLoad throws, no child route ever starts loading.
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      // redirect preservation (returning you to where you were headed)
      // is 6.4's job — today the guard just bounces to the login page
      throw redirect({ to: "/login" });
    }
  },
});
