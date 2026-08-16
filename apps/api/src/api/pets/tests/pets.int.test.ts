import { setTimeout as delay } from "node:timers/promises";

import { sql } from "drizzle-orm";
import request from "supertest";
import { describe, expect, it } from "vitest";

import {
  petListSchema,
  petSchema,
  problemSchema,
  type Pet,
} from "@petlife/shared";

import { createApp } from "../../../app.ts";
import { db } from "../../../db/client.ts";
import { buildPetPayload, createPetType } from "./pets.factories.ts";

const app = createApp();

// supertest types res.body as any — funnel every body through a shared
// schema instead: it types AND proves the wire contract in one move
const asPet = (body: unknown): Pet => petSchema.parse(body);

// a valid uuid that is in no table
const PHANTOM_ID = "0198a3d2-7d5c-7a5e-8f5e-3b1a2c4d5e99";

describe("POST /api/v1/pets", () => {
  it("creates a pet: 201, Location, entity body, defaults applied", async () => {
    const type = await createPetType();
    const res = await request(app)
      .post("/api/v1/pets")
      .send(buildPetPayload(type.id));

    expect(res.status).toBe(201);
    const pet = asPet(res.body);
    expect(res.get("Location")).toBe(`/api/v1/pets/${pet.id}`);
    expect(pet.name).toBe("Bruno");
    expect(pet.sex).toBe("unknown");
    expect(pet.dateOfBirth).toBe("2020-05-01");
    expect(pet.adoptionDate).toBeNull();
  });

  it("rejects a create with neither date, flagging both fields", async () => {
    const type = await createPetType();
    const res = await request(app)
      .post("/api/v1/pets")
      .send({ name: "Ghost", petTypeId: type.id });

    expect(res.status).toBe(400);
    const problem = problemSchema.parse(res.body);
    expect(problem.errors).toHaveProperty("dateOfBirth");
    expect(problem.errors).toHaveProperty("adoptionDate");
  });

  it("rejects unknown keys (strict DTO)", async () => {
    const type = await createPetType();
    const res = await request(app)
      .post("/api/v1/pets")
      .send({ ...buildPetPayload(type.id), date_of_birth: "2020-05-01" });

    expect(res.status).toBe(400);
  });

  it("answers 422 when petTypeId references no pet type", async () => {
    const res = await request(app)
      .post("/api/v1/pets")
      .send(buildPetPayload(PHANTOM_ID));

    expect(res.status).toBe(422);
    const problem = problemSchema.parse(res.body);
    expect(problem.detail).toContain("pet type");
  });
});

describe("GET /api/v1/pets/:petId", () => {
  it("round-trips a created pet", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    const res = await request(app).get(`/api/v1/pets/${created.id}`);
    expect(res.status).toBe(200);
    expect(asPet(res.body)).toEqual(created);
  });

  it("404s for an unknown id", async () => {
    const res = await request(app).get(`/api/v1/pets/${PHANTOM_ID}`);
    expect(res.status).toBe(404);
    expect(res.type).toBe("application/problem+json");
  });

  it("400s for a malformed id", async () => {
    const res = await request(app).get("/api/v1/pets/not-a-uuid");
    expect(res.status).toBe(400);
    const problem = problemSchema.parse(res.body);
    expect(problem.errors).toHaveProperty("petId");
  });
});

describe("GET /api/v1/pets (list)", () => {
  it("paginates with stable totals", async () => {
    const type = await createPetType();
    for (const name of ["Alpha", "Mid", "Zed"]) {
      await request(app)
        .post("/api/v1/pets")
        .send(buildPetPayload(type.id, { name }));
    }

    const page1 = petListSchema.parse(
      (await request(app).get("/api/v1/pets?page=1&pageSize=2")).body,
    );
    expect(page1.totalItems).toBe(3);
    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(2);

    const page2 = petListSchema.parse(
      (await request(app).get("/api/v1/pets?page=2&pageSize=2")).body,
    );
    expect(page2.items).toHaveLength(1);

    const ids = [...page1.items, ...page2.items].map((p) => p.id);
    expect(new Set(ids).size).toBe(3);
  });

  it("sorts by name ascending on request", async () => {
    const type = await createPetType();
    for (const name of ["Zed", "Alpha", "Mid"]) {
      await request(app)
        .post("/api/v1/pets")
        .send(buildPetPayload(type.id, { name }));
    }

    const list = petListSchema.parse(
      (await request(app).get("/api/v1/pets?sort=name&order=asc")).body,
    );
    expect(list.items.map((p) => p.name)).toEqual(["Alpha", "Mid", "Zed"]);
  });

  it("rejects out-of-bounds paging", async () => {
    const res = await request(app).get("/api/v1/pets?page=0");
    expect(res.status).toBe(400);
    const problem = problemSchema.parse(res.body);
    expect(problem.errors).toHaveProperty("page");
  });
});

describe("PATCH /api/v1/pets/:petId", () => {
  it("applies a partial update and stamps updatedAt", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    // updated_at is app-stamped on update; a beat of real time keeps the
    // two timestamps visibly different
    await delay(10);
    const res = await request(app)
      .patch(`/api/v1/pets/${created.id}`)
      .send({ notes: "Loves the park" });

    expect(res.status).toBe(200);
    const patched = asPet(res.body);
    expect(patched.notes).toBe("Loves the park");
    expect(patched.name).toBe(created.name);
    expect(patched.updatedAt).not.toBe(created.updatedAt);
  });

  it("clears a clearable field with null", async () => {
    const type = await createPetType();
    const created = asPet(
      (
        await request(app)
          .post("/api/v1/pets")
          .send(buildPetPayload(type.id, { notes: "temp" }))
      ).body,
    );

    const res = await request(app)
      .patch(`/api/v1/pets/${created.id}`)
      .send({ notes: null });
    expect(asPet(res.body).notes).toBeNull();
  });

  it("refuses to clear both dates (merged-row rule)", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    const res = await request(app)
      .patch(`/api/v1/pets/${created.id}`)
      .send({ dateOfBirth: null, adoptionDate: null });

    expect(res.status).toBe(400);
    const problem = problemSchema.parse(res.body);
    expect(problem.detail).toContain("clear both");
  });

  it("rejects an empty patch", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    const res = await request(app).patch(`/api/v1/pets/${created.id}`).send({});
    expect(res.status).toBe(400);
  });

  it("answers 422 when repointing at a phantom pet type", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    const res = await request(app)
      .patch(`/api/v1/pets/${created.id}`)
      .send({ petTypeId: PHANTOM_ID });
    expect(res.status).toBe(422);
  });

  it("404s for an unknown id", async () => {
    const res = await request(app)
      .patch(`/api/v1/pets/${PHANTOM_ID}`)
      .send({ notes: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/v1/pets/:petId", () => {
  it("deletes: 204, then the pet is gone, then delete 404s", async () => {
    const type = await createPetType();
    const created = asPet(
      (await request(app).post("/api/v1/pets").send(buildPetPayload(type.id)))
        .body,
    );

    const del = await request(app).delete(`/api/v1/pets/${created.id}`);
    expect(del.status).toBe(204);
    expect(del.text).toBe("");

    expect((await request(app).get(`/api/v1/pets/${created.id}`)).status).toBe(
      404,
    );
    expect(
      (await request(app).delete(`/api/v1/pets/${created.id}`)).status,
    ).toBe(404);
  });
});

describe("database constraints (the backstop)", () => {
  it("refuses a row that dodges the api's validation", async () => {
    const type = await createPetType();
    // straight SQL, no DTO, no service — the constraint alone must object.
    // drizzle wraps the pg error, so the constraint name rides in `cause`
    const err: unknown = await db
      .execute(
        sql`INSERT INTO pets (pet_type_id, name, sex, date_of_birth)
            VALUES (${type.id}, 'Robo', 'robot', '2020-01-01')`,
      )
      .then(() => null)
      .catch((e: unknown) => e);

    expect(err).toBeInstanceOf(Error);
    if (err instanceof Error) {
      expect(String(err.cause)).toContain("pets_sex_ck");
    }
  });
});
