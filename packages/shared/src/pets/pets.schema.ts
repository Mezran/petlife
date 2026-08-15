import * as z from "zod";

import { paginated } from "../pagination.schema.ts";

// Wire contracts for the pets resource

// section: field vocabulary

// mirrors pets_sex_ck — changing this list means a migration plus this enum
export const petSexSchema = z.enum(["male", "female", "unknown"]);

// calendar facts (birthdays, adoptions) travel as plain ISO dates,
// YYYY-MM-DD — no time, no zone
const isoDate = z.iso.date();

// the db deliberately has no future-date CHECK (CURRENT_DATE isn't
// immutable — see .docs/db/schema.sql), so the time-relative rule lives at
// this boundary. Compared against UTC today; ISO dates sort lexicographically
const isoDatePast = isoDate.refine(
  (d) => d <= new Date().toISOString().slice(0, 10),
  { error: "Must not be in the future." },
);

// api-level bounds the db deliberately doesn't have (text is uncapped
// there) — a contract cap keeps abusive payloads out at the boundary
const petName = z.string().trim().min(1).max(100);
const petNotes = z.string().trim().max(2000);

// section: entity

// what the api RETURNS for a pet — always complete, nullables explicit.
// Looser than the DTOs on purpose: the entity must accept any row the db
// legally holds
export const petSchema = z.object({
  id: z.uuid(),
  petTypeId: z.uuid(),
  name: z.string().min(1),
  sex: petSexSchema,
  dateOfBirth: isoDate.nullable(),
  adoptionDate: isoDate.nullable(),
  notes: z.string().nullable(),
  // Date#toISOString() output: Z-suffixed, exactly what the default accepts
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Pet = z.infer<typeof petSchema>;

// section: DTOs

// strictObject: unknown keys are a 400, not a silent drop — a client typo
// (date_of_birth) should fail loudly
export const petCreateSchema = z
  .strictObject({
    name: petName,
    petTypeId: z.uuid(),
    sex: petSexSchema.default("unknown"),
    dateOfBirth: isoDatePast.optional(),
    adoptionDate: isoDatePast.optional(),
    notes: petNotes.optional(),
  })
  // mirrors pets_dob_or_adoption_ck: inclusive or — both is fine, neither
  // is not; flag both fields so forms can highlight both inputs
  .superRefine((val, ctx) => {
    if (val.dateOfBirth === undefined && val.adoptionDate === undefined) {
      for (const path of ["dateOfBirth", "adoptionDate"]) {
        ctx.addIssue({
          code: "custom",
          path: [path],
          message: "Provide dateOfBirth or adoptionDate (at least one).",
        });
      }
    }
  });

export type PetCreate = z.output<typeof petCreateSchema>;
// what clients may SEND (sex still optional) — the web form's type (6.6)
export type PetCreateInput = z.input<typeof petCreateSchema>;

// PATCH semantics: absent = unchanged, null = clear (dates, notes).
// "clearing can't leave both dates empty" needs the merged row — that rule
// belongs to the service (4.2), with pets_dob_or_adoption_ck as backstop
export const petUpdateSchema = z
  .strictObject({
    name: petName.optional(),
    petTypeId: z.uuid().optional(),
    sex: petSexSchema.optional(),
    dateOfBirth: isoDatePast.nullable().optional(),
    adoptionDate: isoDatePast.nullable().optional(),
    notes: petNotes.nullable().optional(),
  })
  // JSON can't express undefined, so present keys are the whole story:
  // an empty patch object is a 400
  .refine((val) => Object.keys(val).length > 0, {
    error: "Update at least one field.",
  });

export type PetUpdate = z.infer<typeof petUpdateSchema>;

// section: route params

export const petIdParamsSchema = z.object({
  petId: z.uuid(),
});

export type PetIdParams = z.infer<typeof petIdParamsSchema>;

// section: list response

export const petListSchema = paginated(petSchema);

export type PetList = z.infer<typeof petListSchema>;
