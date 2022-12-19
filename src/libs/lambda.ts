import middy, { MiddyfiedHandler } from "@middy/core";
import middyDoNotWaitForEmptyEventLoop from "@middy/do-not-wait-for-empty-event-loop";
import middyJsonBodyParser from "@middy/http-json-body-parser";
import { Context, Handler } from "aws-lambda";

export const middyfy = (
  handler: Handler
): MiddyfiedHandler<any, any, Error, Context> => {
  return middy(handler)
    .use(middyDoNotWaitForEmptyEventLoop())
    .use(middyJsonBodyParser());
};
