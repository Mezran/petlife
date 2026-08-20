import { randomUUID } from "node:crypto";

import type { Express } from "express";
import request from "supertest";
import * as z from "zod";

import type { PetCreateInput } from "@petlife/shared";

import { db } from "../../../db/client.ts";
import { petTypes } from "../../../db/schema.ts";

// Factories: valid data by default, and each test states only what it
// cares about via overrides.

// BetterAuth's origin check trusts the configured base URL — in tests that is
// http://localhost:3999 (vitest.config.ts sets PORT=3999)
export const TRUSTED_ORIGIN = "http://localhost:3999";

const signUpResponseSchema = z.object({
  user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
});

// registers a fresh user through the real sign-up endpoint and hands back the
// session cookie — tests authenticate exactly the way a client would
export const registerUser = async (app: Express) => {
  const email = `user-${randomUUID()}@petlife.dev`;
  const res = await request(app)
    .post("/api/auth/sign-up/email")
    .set("Origin", TRUSTED_ORIGIN)
    .send({ name: "Test User", email, password: "hunter2hunter2" });
  if (res.status !== 200) {
    throw new Error(`sign-up failed in factory: ${String(res.status)}`);
  }
  const setCookie = res.get("Set-Cookie")?.at(0);
  const cookie = setCookie?.split(";").at(0);
  if (cookie === undefined) {
    throw new Error("sign-up set no session cookie");
  }
  const body: unknown = res.body;
  return { user: signUpResponseSchema.parse(body).user, cookie };
};

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
