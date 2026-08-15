import { describe, expect, it } from "vitest";
import * as z from "zod";

import {
  petCreateSchema,
  petIdParamsSchema,
  petListSchema,
  petSchema,
  petUpdateSchema,
} from "@petlife/shared";

const petRow = {
  id: "0198a3d2-7d5c-7a5e-8f5e-3b1a2c4d5e6f",
  petTypeId: "0198a3d2-7d5c-7a5e-8f5e-3b1a2c4d5e70",
  name: "Bruno",
  sex: "male",
  dateOfBirth: "2020-05-01",
  adoptionDate: null,
  notes: null,
  createdAt: "2026-08-14T12:00:00.000Z",
  updatedAt: "2026-08-14T12:00:00.000Z",
};

describe("petSchema (entity)", () => {
  it("accepts a full pet as the api returns it", () => {
    expect(petSchema.parse(petRow)).toEqual(petRow);
  });

  it("rejects a non-uuid id", () => {
    expect(petSchema.safeParse({ ...petRow, id: "42" }).success).toBe(false);
  });

  it("rejects a timestamp without a timezone", () => {
    expect(
      petSchema.safeParse({ ...petRow, createdAt: "2026-08-14T12:00:00" })
        .success,
    ).toBe(false);
  });
});

describe("petCreateSchema", () => {
  it("fills defaults on a minimal valid create", () => {
    const parsed = petCreateSchema.parse({
      name: "Bruno",
      petTypeId: petRow.petTypeId,
      dateOfBirth: "2020-05-01",
    });
    expect(parsed.sex).toBe("unknown");
  });

  it("trims the name", () => {
    const parsed = petCreateSchema.parse({
      name: "  Bruno  ",
      petTypeId: petRow.petTypeId,
      adoptionDate: "2024-01-15",
    });
    expect(parsed.name).toBe("Bruno");
  });

  it("rejects a blank name", () => {
    const result = petCreateSchema.safeParse({
      name: "   ",
      petTypeId: petRow.petTypeId,
      dateOfBirth: "2020-05-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when both dates are missing, flagging both fields", () => {
    const result = petCreateSchema.safeParse({
      name: "Bruno",
      petTypeId: petRow.petTypeId,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = z.flattenError(result.error).fieldErrors;
      expect(fields.dateOfBirth).toBeDefined();
      expect(fields.adoptionDate).toBeDefined();
    }
  });

  it("rejects a future date of birth", () => {
    const result = petCreateSchema.safeParse({
      name: "Bruno",
      petTypeId: petRow.petTypeId,
      dateOfBirth: "2999-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys", () => {
    const result = petCreateSchema.safeParse({
      name: "Bruno",
      petTypeId: petRow.petTypeId,
      dateOfBirth: "2020-05-01",
      date_of_birth: "2020-05-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sex", () => {
    const result = petCreateSchema.safeParse({
      name: "Bruno",
      petTypeId: petRow.petTypeId,
      dateOfBirth: "2020-05-01",
      sex: "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("petUpdateSchema", () => {
  it("accepts a single-field patch", () => {
    expect(petUpdateSchema.parse({ name: "Rex" })).toEqual({ name: "Rex" });
  });

  it("accepts null to clear a clearable field", () => {
    expect(petUpdateSchema.parse({ notes: null })).toEqual({ notes: null });
  });

  it("rejects an empty patch", () => {
    expect(petUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects unknown keys", () => {
    expect(petUpdateSchema.safeParse({ nickname: "B" }).success).toBe(false);
  });
});

describe("petIdParamsSchema", () => {
  it("accepts a uuid petId", () => {
    expect(petIdParamsSchema.parse({ petId: petRow.id })).toEqual({
      petId: petRow.id,
    });
  });

  it("rejects a malformed petId", () => {
    expect(petIdParamsSchema.safeParse({ petId: "abc" }).success).toBe(false);
  });
});

describe("petListSchema", () => {
  it("accepts a paginated envelope of pets", () => {
    const envelope = {
      items: [petRow],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    };
    expect(petListSchema.parse(envelope)).toEqual(envelope);
  });
});
