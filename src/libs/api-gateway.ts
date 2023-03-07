import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S extends JSONSchema> = Omit<
  APIGatewayProxyEvent,
  "body"
> & {
  body: FromSchema<S>;
};
export type ValidatedEventAPIGatewayProxyEvent<S extends JSONSchema> = Handler<
  ValidatedAPIGatewayProxyEvent<S>,
  APIGatewayProxyResult
>;

export const formatJSONResponse = (
  statusCode: number,
  response?: string | Record<string, unknown>
) => {
  if (!response) {
    return {
      statusCode,
      body: "",
    };
  }

  return {
    statusCode,
    body: typeof response === "string" ? response : JSON.stringify(response),
  };
};
