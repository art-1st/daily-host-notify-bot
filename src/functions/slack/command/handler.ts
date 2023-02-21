// import { DynamoDB } from "@aws-sdk/client-dynamodb";
// import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
// import {
//   InvokeCommand,
//   InvokeCommandInput,
//   LambdaClient,
// } from "@aws-sdk/client-lambda";
import {
  formatJSONResponse,
  ValidatedEventAPIGatewayProxyEvent,
} from "@libs/api-gateway";
// import { WebClient } from "@slack/web-api";
// import { TABLES } from "src/constants";
import { CommandItem, CommandRequestPayload } from "src/types/command";
import { commandSetup } from "./commands/setup";
import { commandShowInfo } from "./commands/info";
import { commandAddUser } from "./commands/user-add";
import { commandRemoveUser } from "./commands/user-remove";

const {
  // AWS_REGION,
  SERVICE_NAME,
  SLACK_BOT_TOKEN,
} = process.env;

// const lambdaClient = new LambdaClient({ region: AWS_REGION });
// const ddbClient = new DynamoDB({ region: AWS_REGION });

const command: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const { body } = event;

  if (!SERVICE_NAME || !SLACK_BOT_TOKEN) {
    return formatJSONResponse(500, {
      message: "Internal Server Error",
    });
  }

  // const slackWeb = new WebClient(SLACK_BOT_TOKEN);

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
    const payload = Object.fromEntries(
      new URLSearchParams(body)
    ) as unknown as CommandRequestPayload;

    console.log("[COMMAND]", payload.command);

    switch (payload.command) {
      case CommandItem.SETUP:
        return await commandSetup(payload);
      case CommandItem.INFO:
        return await commandShowInfo(payload);
      case CommandItem.USER_ADD:
        return await commandAddUser(payload);
      case CommandItem.USER_REMOVE:
        return await commandRemoveUser(payload);
      default:
        return formatJSONResponse(400, {
          message: "Unknown command.",
        });
    }
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
