import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createApp } from "../../../app.ts";
import { setReady } from "../../../readiness.ts";

const app = createApp();

// index.ts flips readiness on after listen; tests drive it by hand
afterAll(() => {
  setReady(false);
});

describe("GET /readyz", () => {
  it("reports draining before the app declares itself ready", async () => {
    setReady(false);
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "draining" });
  });

  it("proves a live db round-trip once ready", async () => {
    setReady(true);
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready", db: "ok" });
  });
});
