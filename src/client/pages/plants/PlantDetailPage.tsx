import { useParams } from "react-router-dom";
import { useTracedQuery } from "../../instrumentation/react-query";
import { getPlant } from "../../services";

export const PlantDetailPage = () => {
  const { plantId } = useParams();
  const { data: plant } = useTracedQuery<{
    id: string;
    name: string;
    imageUrl: string;
  }>({
    queryKey: ["plants", plantId],
    queryFn: plantId ? () => getPlant(plantId) : undefined,
    enabled: !!plantId,
  });

  if (!plant) return "Loading...";

  return (
    <div className="flex items-center justify-center mt-20">
      <div className="card card-compact w-96 bg-base-100 shadow-xl">
        <figure>
          <img
            src={plant.imageUrl}
            alt={plant.name}
            className="object-cover h-48 w-96"
          />
        </figure>

        <div className="card-body">
          <h2 className="card-title">{plant.name}</h2>
        </div>
      </div>
    </div>
  );
};
