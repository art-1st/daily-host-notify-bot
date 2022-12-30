import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import {
  InvokeCommand,
  InvokeCommandInput,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
import { WebClient } from "@slack/web-api";
import { TABLES } from "src/constants";

const {
  AWS_REGION,
  SERVICE_NAME,
  SLACK_BOT_TOKEN,
  JIRA_KANBAN_NAME,
  JIRA_KANBAN_URL,
} = process.env;

const lambdaClient = new LambdaClient({ region: AWS_REGION });
const client = new DynamoDB({ region: AWS_REGION });

const command: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const { body } = event;

  if (
    !SERVICE_NAME ||
    !SLACK_BOT_TOKEN ||
    !JIRA_KANBAN_NAME ||
    !JIRA_KANBAN_URL
  ) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  const slackWeb = new WebClient(SLACK_BOT_TOKEN);

  if (typeof body !== "string") {
    return formatJSONResponse(400, {
      message: "Bad Request",
    });
  }

  const slackResponsePayload = body.split("=")[1];

  if (!slackResponsePayload) {
    return formatJSONResponse(400, {
      message: "Bad Request",
    });
  }

  try {
    const request = Object.fromEntries(new URLSearchParams(body));

    console.log(JSON.stringify(request));

    return formatJSONResponse(200, {});
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log(e.name);
      console.log(e.message);
    }

    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }
};

export const main = command;
