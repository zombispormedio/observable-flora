import { ObjectId } from "mongodb";
import { database } from "./db";

interface Plant {
  id: string;
  name: string;
  imageUrl: string;
}

interface PlantDocument {
  id: string;
  name: string;
  imageUrl: string;
}

export const createPlant = async (plant: {
  name: string;
  imageUrl: string;
}) => {
  const plantCollection = await database.client.db().collection("plants");
  const newPlant = await plantCollection.insertOne(plant);
  return newPlant.insertedId;
};

export const getPaginatedPlants = async ({
  offset,
  limit,
}: {
  offset: number;
  limit: number;
}) => {
  const plantCollection = await database.client
    .db()
    .collection<PlantDocument>("plants");
  const plants = await plantCollection
    .find()
    .skip(offset)
    .limit(limit)
    .toArray();
  return plants.map<Plant>((plant) => ({
    id: plant._id.toString(),
    name: plant.name,
    imageUrl: plant.imageUrl,
  }));
};

export const getPlantsCount = async () => {
  return database.client
    .db()
    .collection<PlantDocument>("plants")
    .countDocuments();
};

export const getPlantById = async (plantId: string) => {
  return database.client
    .db()
    .collection<PlantDocument>("plants")
    .find({ _id: new ObjectId(plantId) });
};

export const deletePlantById = async (plantId: string) => {
  return database.client
    .db()
    .collection<PlantDocument>("plants")
    .deleteOne({ _id: new ObjectId(plantId) });
};
