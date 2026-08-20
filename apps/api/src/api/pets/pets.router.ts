import { Router } from "express";

import {
  petCreateSchema,
  petIdParamsSchema,
  petListQuerySchema,
  petUpdateSchema,
} from "@petlife/shared";

import { authedUser } from "../../middleware/require-auth.ts";
import { validate } from "../../middleware/validate.ts";
import {
  createPet,
  deletePet,
  getPet,
  listPets,
  updatePet,
} from "./pets.service.ts";

export const petsRouter = Router();

// POST /api/v1/pets — 201 + Location pointing at the new resource
petsRouter.post("/", validate({ body: petCreateSchema }), async (req, res) => {
  const pet = await createPet(req.body, authedUser(req).id);
  res.location(`${req.baseUrl}/${pet.id}`).status(201).json(pet);
});

// GET /api/v1/pets — paginated, sorted list
petsRouter.get(
  "/",
  validate({ query: petListQuerySchema }),
  async (req, res) => {
    res.json(await listPets(req.query, authedUser(req).id));
  },
);

// GET /api/v1/pets/:petId — one pet or 404
petsRouter.get(
  "/:petId",
  validate({ params: petIdParamsSchema }),
  async (req, res) => {
    res.json(await getPet(req.params.petId, authedUser(req).id));
  },
);

// PATCH /api/v1/pets/:petId — partial update, returns the updated pet
petsRouter.patch(
  "/:petId",
  validate({ params: petIdParamsSchema, body: petUpdateSchema }),
  async (req, res) => {
    res.json(await updatePet(req.params.petId, req.body, authedUser(req).id));
  },
);

// DELETE /api/v1/pets/:petId — 204, no body
petsRouter.delete(
  "/:petId",
  validate({ params: petIdParamsSchema }),
  async (req, res) => {
    await deletePet(req.params.petId, authedUser(req).id);
    res.status(204).end();
  },
);
