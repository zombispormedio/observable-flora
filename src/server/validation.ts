import Ajv from "ajv";
import addFormats from "ajv-formats";

const ajv = new Ajv();

addFormats(ajv);

const PlantCreateInputSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      minLength: 1,
      maxLength: 50,
    },
    imageUrl: {
      type: "string",
      format: "uri",
      minLength: 1,
      maxLength: 1000,
    },
  },
  required: ["name", "imageUrl"],
};

export const validatePlantCreateInput = (validateParams: {
  [x: string]: {};
}) => {
  const valid = ajv.validate(PlantCreateInputSchema, validateParams);

  return {
    valid,
    errors: ajv.errorsText(),
  };
};

const PaginationSchema = {
  type: "object",
  properties: {
    offset: {
      type: "number",
      minimum: 0,
    },
    limit: {
      type: "number",
      minimum: 1,
      maximum: 100,
    },
  },
};

export const validatePagination = (validateParams: { [x: string]: {} }) => {
  const valid = ajv.validate(PaginationSchema, validateParams);

  return {
    valid,
    errors: ajv.errorsText(),
  };
};
