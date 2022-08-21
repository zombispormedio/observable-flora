import { Router } from "express";
import {
  createPlant,
  deletePlantById,
  getPaginatedPlants,
  getPlantById,
  getPlantsCount,
} from "./features";
import { validatePagination, validatePlantCreateInput } from "./validation";

export const router = Router();

router
  .route("/plants")
  .post(async (req, res) => {
    const { body } = req;

    const validationResult = validatePlantCreateInput(body);

    if (!validationResult.valid) {
      return res.status(400).send({
        message: validationResult.errors,
      });
    }

    const plantId = await createPlant(body);

    res.status(201).json({
      created: {
        id: plantId,
      },
    });
  })
  .get(async (req, res) => {
    const { query } = req;
    const paginationParams = {
      offset: query.offset ? Number(query.offset) : 0,
      limit: query.limit ? Number(query.limit) : 10,
    };
    const validationResult = validatePagination(paginationParams);

    if (!validationResult.valid) {
      return res.status(400).send({
        message: validationResult.errors,
      });
    }

    const items = await getPaginatedPlants(paginationParams);

    res.status(200).json({
      items,
      pagination: paginationParams,
    });
  });

router.route("/plants/count").get(async (req, res) => {
  const count = await getPlantsCount();

  res.status(200).json({
    count,
  });
});

router
  .route("/plants/:id")
  .get(async (req, res) => {
    const { id } = req.params;

    const plant = await getPlantById(id);

    if (!plant) {
      return res.status(404).end();
    }

    res.status(200).json(plant);
  })
  .delete(async (req, res) => {
    const { id } = req.params;

    await deletePlantById(id);

    res.status(204).end();
  });
