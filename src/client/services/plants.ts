import { PAGINATION_PAGE_SIZE } from "../contants";

export const createPlant = (params: { name: string; imageUrl: string }) => {
  return fetch("/api/plants", {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const deletePlant = (id: string) => {
  return fetch(`/api/plants/${id}`, {
    method: "DELETE",
  });
};

export const getPlants = ({ offset }: { offset: number }) => {
  return fetch(
    `/api/plants?limit=${PAGINATION_PAGE_SIZE}&offset=${offset}`
  ).then((res) => res.json());
};

export const getPlantsCount = () =>
  fetch("/api/plants/count").then((res) => res.json());

export const getPlant = (id: string) => {
  return fetch(`/api/plants/${id}`).then((res) => res.json());
};
