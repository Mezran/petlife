import { asc, count, desc, eq } from "drizzle-orm";

import { db } from "../../db/client.ts";
import { pets, petTypes } from "../../db/schema.ts";

export type PetRow = typeof pets.$inferSelect;
export type NewPetRow = typeof pets.$inferInsert;
// the columns a PATCH may touch — id and timestamps stay out of reach
export type PetRowPatch = Partial<
  Pick<
    NewPetRow,
    "name" | "petTypeId" | "sex" | "dateOfBirth" | "adoptionDate" | "notes"
  >
>;

// the sortable columns, closed set — mirrors petListQuerySchema's enum
const sortColumns = {
  createdAt: pets.createdAt,
  name: pets.name,
} as const;
export type PetSortKey = keyof typeof sortColumns;

// section: writes

export const insertPet = async (data: NewPetRow): Promise<PetRow> => {
  const rows = await db.insert(pets).values(data).returning();
  const row = rows.at(0);
  if (row === undefined) {
    throw new Error("insert into pets returned no row");
  }
  return row;
};

export const updatePet = async (
  id: string,
  patch: PetRowPatch,
): Promise<PetRow | undefined> => {
  // updated_at is app-maintained (3.2 decision) — every update stamps it
  const rows = await db
    .update(pets)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(pets.id, id))
    .returning();
  return rows.at(0);
};

export const deletePet = async (id: string): Promise<PetRow | undefined> => {
  const rows = await db.delete(pets).where(eq(pets.id, id)).returning();
  return rows.at(0);
};

// section: reads

export const findPetById = async (id: string): Promise<PetRow | undefined> => {
  const rows = await db.select().from(pets).where(eq(pets.id, id));
  return rows.at(0);
};

export const listPets = async (options: {
  limit: number;
  offset: number;
  sort: PetSortKey;
  order: "asc" | "desc";
}): Promise<{ rows: PetRow[]; total: number }> => {
  const direction = options.order === "asc" ? asc : desc;
  // id rides along as the tie-breaker so equal sort values can't shuffle
  // rows between pages
  const rows = await db
    .select()
    .from(pets)
    .orderBy(direction(sortColumns[options.sort]), direction(pets.id))
    .limit(options.limit)
    .offset(options.offset);
  const totals = await db.select({ total: count() }).from(pets);
  return { rows, total: totals.at(0)?.total ?? 0 };
};

// pet_types stays here until Phase 7 gives it a feature of its own
export const petTypeExists = async (id: string): Promise<boolean> => {
  const rows = await db
    .select({ id: petTypes.id })
    .from(petTypes)
    .where(eq(petTypes.id, id));
  return rows.length > 0;
};
