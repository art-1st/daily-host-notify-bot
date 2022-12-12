import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import got from "got";

const { SLACK_INCOMING_WEBHOOK_ENDPOINT } = process.env;

const send: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (!SLACK_INCOMING_WEBHOOK_ENDPOINT)
    return formatJSONResponse(500, {
      message: "Server Error",
    });

  // Send message to Slack
  await got.post(SLACK_INCOMING_WEBHOOK_ENDPOINT, {
    json: {
      text: "HiHiHi",
    },
  });

  return formatJSONResponse(200, {
    message: `Hello, welcome to the exciting Serverless world!`,
    event,
  });
};

export const main = send;
