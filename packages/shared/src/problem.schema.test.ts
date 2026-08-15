import { describe, expect, it } from "vitest";

import { problemSchema } from "@petlife/shared";

const validationProblem = {
  type: "about:blank",
  title: "Bad Request",
  status: 400,
  detail: "Request validation failed.",
  instance: "/api/v1/pets",
  requestId: "req-1",
  errors: { name: ["Too small: expected string to have >=1 characters"] },
};

describe("problemSchema", () => {
  it("accepts the validation-failure shape the api emits", () => {
    expect(problemSchema.parse(validationProblem)).toEqual(validationProblem);
  });

  it("accepts a minimal problem without detail or errors", () => {
    const minimal = {
      type: "about:blank",
      title: "Not Found",
      status: 404,
      instance: "/api/v1/nope",
      requestId: 7,
    };
    expect(problemSchema.parse(minimal)).toEqual(minimal);
  });

  it("rejects a non-error status", () => {
    expect(
      problemSchema.safeParse({ ...validationProblem, status: 200 }).success,
    ).toBe(false);
  });

  it("rejects a problem missing its title", () => {
    const result = problemSchema.safeParse({
      type: "about:blank",
      status: 404,
      instance: "/api/v1/nope",
      requestId: "req-2",
    });
    expect(result.success).toBe(false);
  });
});
