import {
  petSchema,
  type Pet,
  type PetCreate,
  type PetList,
  type PetListQuery,
  type PetUpdate,
} from "@petlife/shared";

import { AppError, NotFoundError } from "../../errors.ts";
import {
  deletePet as deletePetRow,
  findPetById,
  insertPet,
  listPets as listPetRows,
  petTypeExists,
  updatePet as updatePetRow,
  type PetRow,
} from "./pets.repository.ts";

// section: row → wire mapping

// the db row (Date objects) and the wire entity (ISO strings) are different
// types on purpose. Parse, don't cast: every outgoing pet is proven against
// the shared schema, so a bad mapping can never leak a malformed pet
const toPet = (row: PetRow): Pet =>
  petSchema.parse({
    id: row.id,
    petTypeId: row.petTypeId,
    name: row.name,
    sex: row.sex,
    dateOfBirth: row.dateOfBirth,
    adoptionDate: row.adoptionDate,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

// section: business rules

// shape-valid but semantically wrong → 422 (400 is the DTO's territory,
// 409 stays reserved for state conflicts)
const assertPetTypeExists = async (petTypeId: string): Promise<void> => {
  if (!(await petTypeExists(petTypeId))) {
    throw new AppError(
      422,
      "Unprocessable Entity",
      "petTypeId does not reference a known pet type",
    );
  }
};

// section: use cases

export const createPet = async (dto: PetCreate): Promise<Pet> => {
  await assertPetTypeExists(dto.petTypeId);
  const row = await insertPet({
    name: dto.name,
    petTypeId: dto.petTypeId,
    sex: dto.sex,
    dateOfBirth: dto.dateOfBirth,
    adoptionDate: dto.adoptionDate,
    notes: dto.notes,
  });
  return toPet(row);
};

export const getPet = async (id: string): Promise<Pet> => {
  const row = await findPetById(id);
  if (row === undefined) {
    throw new NotFoundError(`No pet with id ${id}`);
  }
  return toPet(row);
};

export const listPets = async (query: PetListQuery): Promise<PetList> => {
  const { rows, total } = await listPetRows({
    limit: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
    sort: query.sort,
    order: query.order,
  });
  return {
    items: rows.map(toPet),
    page: query.page,
    pageSize: query.pageSize,
    totalItems: total,
    totalPages: Math.ceil(total / query.pageSize),
  };
};

export const updatePet = async (id: string, patch: PetUpdate): Promise<Pet> => {
  const current = await findPetById(id);
  if (current === undefined) {
    throw new NotFoundError(`No pet with id ${id}`);
  }
  if (patch.petTypeId !== undefined) {
    await assertPetTypeExists(patch.petTypeId);
  }

  // the one rule the DTO can't check alone: after merging the patch onto
  // the row, at least one date must remain (pets_dob_or_adoption_ck
  // backstops this at the db)
  const mergedDateOfBirth =
    patch.dateOfBirth !== undefined ? patch.dateOfBirth : current.dateOfBirth;
  const mergedAdoptionDate =
    patch.adoptionDate !== undefined
      ? patch.adoptionDate
      : current.adoptionDate;
  if (mergedDateOfBirth === null && mergedAdoptionDate === null) {
    throw new AppError(
      400,
      "Bad Request",
      "A pet needs dateOfBirth or adoptionDate — this patch would clear both.",
    );
  }

  const row = await updatePetRow(id, patch);
  if (row === undefined) {
    // vanished between the read and the write — still a 404
    throw new NotFoundError(`No pet with id ${id}`);
  }
  return toPet(row);
};

export const deletePet = async (id: string): Promise<void> => {
  const row = await deletePetRow(id);
  if (row === undefined) {
    throw new NotFoundError(`No pet with id ${id}`);
  }
};
