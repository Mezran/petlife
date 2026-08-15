import { describe, expect, it } from "vitest";
import * as z from "zod";

import { pageQuerySchema, paginated } from "@petlife/shared";

describe("pageQuerySchema", () => {
  it("applies defaults to an empty query", () => {
    expect(pageQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces query-string numbers", () => {
    expect(pageQuerySchema.parse({ page: "3", pageSize: "50" })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it("rejects page zero", () => {
    expect(pageQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });

  it("caps pageSize at 100", () => {
    expect(pageQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(pageQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
  });
});

describe("paginated", () => {
  const listSchema = paginated(z.object({ id: z.uuid() }));

  it("accepts a well-formed envelope", () => {
    const envelope = {
      items: [{ id: "0198a3d2-7d5c-7a5e-8f5e-3b1a2c4d5e6f" }],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    };
    expect(listSchema.parse(envelope)).toEqual(envelope);
  });

  it("rejects an envelope whose items don't match", () => {
    expect(
      listSchema.safeParse({
        items: [{ id: "not-a-uuid" }],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      }).success,
    ).toBe(false);
  });
});
