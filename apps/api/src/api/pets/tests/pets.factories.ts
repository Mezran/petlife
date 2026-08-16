import { randomUUID } from "node:crypto";

import type { PetCreateInput } from "@petlife/shared";

import { db } from "../../../db/client.ts";
import { petTypes } from "../../../db/schema.ts";

// Factories: valid data by default, and each test states only what it
// cares about via overrides.

export const createPetType = async (name?: string) => {
  const rows = await db
    .insert(petTypes)
    .values({ name: name ?? `type-${randomUUID()}` })
    .returning();
  const row = rows.at(0);
  if (row === undefined) {
    throw new Error("insert into pet_types returned no row");
  }
  return row;
};

export const buildPetPayload = (
  petTypeId: string,
  overrides: Partial<PetCreateInput> = {},
): PetCreateInput => ({
  name: "Bruno",
  petTypeId,
  dateOfBirth: "2020-05-01",
  ...overrides,
});
