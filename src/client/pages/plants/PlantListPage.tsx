import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { useEffect } from "react";
import { TrashIcon } from "@heroicons/react/solid";
import {
  useTracedMutation,
  useTracedQuery,
} from "../../instrumentation/react-query";
import classNames from "classnames";
import { PAGINATION_PAGE_SIZE } from "../../contants";
import {
  createPlant,
  deletePlant,
  getPlants,
  getPlantsCount,
} from "../../services";
import { Link, useSearchParams } from "react-router-dom";
import { useTracePageDataLoad } from "../../instrumentation/hooks";
import { useTracedNavigation } from "../../instrumentation/TracedNavigation";
import { useTracedEventHandler } from "../../instrumentation/event-handlers";

export const PlantListPage = () => {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams({ offset: "0" });
  const offset = Number(searchParams.get("offset"));

  const {
    data: countData,
    isLoading: isPlantsCountLoading,
    isRefetching: isPlantsCountRefetching,
  } = useTracedQuery<{
    count: number;
  }>(["plants.count"], getPlantsCount);

  const plantsCount = countData?.count ?? 0;

  useEffect(() => {
    if (isPlantsCountLoading) return;
    if (offset >= plantsCount || offset % PAGINATION_PAGE_SIZE !== 0) {
      setSearchParams({ offset: "0" });
    }
  }, [offset, plantsCount, isPlantsCountLoading]);

  const {
    data,
    isLoading: isPlantsLoading,
    isRefetching: isPlantsRefetching,
  } = useTracedQuery<{
    items: { id: string; name: string; imageUrl: string }[];
  }>(
    ["plants", { offset, limit: PAGINATION_PAGE_SIZE }],
    () => getPlants({ offset }),
    {
      enabled:
        plantsCount > 0 &&
        offset < plantsCount &&
        offset % PAGINATION_PAGE_SIZE === 0,
    }
  );

  useTracePageDataLoad(
    isPlantsCountLoading || isPlantsLoading,
    isPlantsCountRefetching || isPlantsRefetching
  );
  const tracedNavigation = useTracedNavigation();

  const { mutate: createPlantMutate } = useTracedMutation(createPlant, {
    onSuccess: () => {
      queryClient.invalidateQueries(["plants"]);
      queryClient.invalidateQueries(["plants.count"]);
    },
  });

  const { mutate: deletePlantMutate } = useTracedMutation(deletePlant, {
    onSuccess: () => {
      queryClient.invalidateQueries(["plants"]);
      queryClient.invalidateQueries(["plants.count"]);
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

  const nextPage = useTracedEventHandler(() => {
    tracedNavigation.setNavigationSpan();
    const nextOffset = offset + PAGINATION_PAGE_SIZE;
    if (nextOffset < plantsCount) {
      setSearchParams({ offset: String(offset + PAGINATION_PAGE_SIZE) });
    }
  });

  const previousPage = useTracedEventHandler(() => {
    tracedNavigation.setNavigationSpan();
    const previousOffset = offset - PAGINATION_PAGE_SIZE;
    if (previousOffset >= 0) {
      setSearchParams({ offset: String(offset - PAGINATION_PAGE_SIZE) });
    }
  });

  console.log(countData?.count, offset);

  const currentPage = Math.ceil(offset / PAGINATION_PAGE_SIZE) + 1;
  const totalPages = Math.ceil((countData?.count || 0) / PAGINATION_PAGE_SIZE);

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
              type="submit"
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
              <div className="stat-desc">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-3">
        <div className="grid grid-cols-1 grid-rows-2 sm:grid-cols-2 xl:grid-cols-3  gap-10">
          {data?.items.map((plant) => (
            <div
              className="card card-compact w-96 bg-base-100 shadow-xl"
              key={plant.id}
            >
              <Link
                to={`/plants/${plant.id}`}
                onClick={() => tracedNavigation.setNavigationSpan()}
              >
                <figure>
                  <img
                    src={plant.imageUrl}
                    alt={plant.name}
                    className="object-cover h-48 w-96"
                  />
                </figure>
              </Link>
              <div className="card-body">
                <h2 className="card-title">{plant.name}</h2>
                <div className="card-actions justify-end">
                  <button
                    className="btn btn-error"
                    data-testid="delete-plant-button"
                    onClick={() => deletePlantMutate(plant.id)}
                  >
                    <TrashIcon className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {plantsCount > PAGINATION_PAGE_SIZE && (
          <div className="mt-20">
            <div className="btn-group grid grid-cols-2 w-full">
              <button
                className={classNames("btn btn-outline", {
                  "btn-disabled": offset === 0,
                })}
                data-testid="prev-page-button"
                onClick={previousPage}
              >
                Previous page
              </button>
              <button
                className={classNames("btn btn-outline", {
                  "btn-disabled": offset + PAGINATION_PAGE_SIZE > plantsCount,
                })}
                onClick={nextPage}
                data-testid="next-page-button"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
