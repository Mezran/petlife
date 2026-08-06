import { describe, expect, it } from "vitest";

import { APP_NAME } from "@petlife/shared";

describe("@petlife/shared public surface", () => {
  it("exports the app name", () => {
    expect(APP_NAME).toBe("PetLife");
  });

  it("keeps the name a non-empty string", () => {
    expect(APP_NAME.length).toBeGreaterThan(0);
  });
});
