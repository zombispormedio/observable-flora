import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { TrashIcon } from "@heroicons/react/solid";
import {
  useTracedMutation,
  useTracedQuery,
} from "../../instrumentation/react-query";
import React, { useState } from "react";
import classNames from "classnames";

const createPlant = (params: { name: string; imageUrl: string }) => {
  return fetch("/api/plants", {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const deletePlant = (id: string) => {
  return fetch(`/api/plants/${id}`, {
    method: "DELETE",
  });
};

const limit = 6;

const getPlants = ({ offset }: { offset: number }) => {
  return fetch(`/api/plants?limit=${limit}&offset=${offset}`).then((res) =>
    res.json()
  );
};

export const PlantListPage = () => {
  const queryClient = useQueryClient();

  const [offset, setOffset] = useState(0);

  const { data } = useTracedQuery<{
    items: { id: string; name: string; imageUrl: string }[];
  }>(["plants", { offset, limit }], () => getPlants({ offset }));

  const { data: countData } = useTracedQuery<{
    count: number;
  }>(["plantsCount"], () =>
    fetch("/api/plants/count").then((res) => res.json())
  );

  const { mutate: createPlantMutate } = useTracedMutation(createPlant, {
    onSuccess: () => {
      queryClient.invalidateQueries(["plants"]);
      queryClient.invalidateQueries(["plantsCount"]);
    },
  });

  const { mutate: deletePlantMutate } = useTracedMutation(deletePlant, {
    onSuccess: () => {
      console.log("deleted");
      queryClient.invalidateQueries(["plants"]);
      queryClient.invalidateQueries(["plantsCount"]);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      imageUrl: "",
    },
    onSubmit: (values, helpers) => {
      helpers.resetForm();
      createPlantMutate(values);
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 m-5 mr-8 gap-10">
      <div className="lg:col-span-1">
        <div className="border border-base-300 bg-base-100 rounded-box p-4">
          <div className="text-xl font-medium">Add new plant</div>
          <div className="mt-5 flex flex-col w-full">
            <div className="flex flex-col mb-5 gap-2">
              <label htmlFor="name">Plant name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Type here"
                className="input input-bordered input-accent"
                onChange={formik.handleChange}
                value={formik.values.name}
              />
            </div>
            <div className="flex flex-col w-full mb-2 gap-2">
              <label htmlFor="imageUrl">Plant image url</label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                placeholder="https://example.com/image.png"
                className="input input-bordered input-accent"
                value={formik.values.imageUrl}
                onChange={formik.handleChange}
              />
            </div>
            <button
              className="btn self-center mt-5"
              data-testid="add-new-plant"
              onClick={() => formik.handleSubmit()}
            >
              Submit
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-5 items-center mt-5">
          <div className="stats shadow w-full">
            <div className="stat">
              <div className="stat-title">Total Plants</div>
              <div className="stat-value">{countData?.count}</div>
              <div className="stat-desc">Page 1 of 10</div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3  gap-10">
          {data?.items.map((plant) => (
            <div
              className="card card-compact w-96 bg-base-100 shadow-xl"
              key={plant.id}
            >
              <figure>
                <img
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="object-cover h-48 w-96"
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{plant.name}</h2>
                <div className="card-actions justify-end">
                  <button
                    className="btn btn-error"
                    onClick={() => deletePlantMutate(plant.id)}
                  >
                    <TrashIcon
                      className="h-5 w-5 text-white"
                      data-testid="delete-plant-button"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-20">
          <div className="btn-group grid grid-cols-2 w-full">
            <button
              className={classNames("btn btn-outline", {
                "btn-disabled": offset === 0,
              })}
            >
              Previous page
            </button>
            <button className="btn btn-outline">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
