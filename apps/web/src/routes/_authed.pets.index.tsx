import { createFileRoute } from "@tanstack/react-router";

// placeholder — real pet data arrives when TanStack Query wires this page
// to the api in 6.3, and the list/detail split lands in 6.5
const PetsPage = () => (
  <section>
    <h2 className="text-display mb-gutter">Your pets</h2>
    <p className="text-sm">
      Pet data arrives when TanStack Query connects this page to the api in 6.3.
    </p>
  </section>
);

export const Route = createFileRoute("/_authed/pets/")({
  component: PetsPage,
});
